// app/api/auth/forgot-password/route.ts
//
// With RESEND_API_KEY set  → sends a real email with a 1-hour reset link
//                            (industry standard — proves email ownership)
// Without RESEND_API_KEY  → direct 2-step reset on the same page
//                            (fallback — no email service needed)
//
// Rate limits:
//   • 5 req / 15 min per IP
//   • 3 req / 60 min per email

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { makeResetToken } from '@/lib/reset-token'

const prisma  = new PrismaClient()
const BASE_URL = process.env.NEXTAUTH_URL || 'https://cine-scope-red.vercel.app'

// ── Rate limiting ─────────────────────────────────────────────────────────────
interface Bucket { count: number; resetAt: number }
const ipBuckets    = new Map<string, Bucket>()
const emailBuckets = new Map<string, Bucket>()

function allow(map: Map<string, Bucket>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  let b = map.get(key)
  if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + windowMs }; map.set(key, b) }
  if (b.count >= max) return false
  b.count++
  return true
}
setInterval(() => {
  const now = Date.now()
  ipBuckets.forEach((v, k)    => { if (now > v.resetAt) ipBuckets.delete(k) })
  emailBuckets.forEach((v, k) => { if (now > v.resetAt) emailBuckets.delete(k) })
}, 5 * 60 * 1000)

const TOO_MANY = NextResponse.json(
  { error: 'Too many attempts. Please wait a few minutes and try again.' },
  { status: 429 }
)

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
}

// ── Email via Resend ──────────────────────────────────────────────────────────
async function sendResetEmail(to: string, resetUrl: string) {
  const key = process.env.RESEND_API_KEY!
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: 'CineScope <noreply@cine-scope-red.vercel.app>',
      to: [to],
      subject: 'Reset your CineScope password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;
                    background:#0f0f1a;color:#fff;border-radius:16px;">
          <h1 style="color:#facc15;margin:0 0 4px">🎬 CineScope</h1>
          <h2 style="margin:0 0 16px">Reset your password</h2>
          <p style="color:#ccc;margin-bottom:24px">
            Click the button below — this link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:linear-gradient(to right,#facc15,#f97316);
                    color:#1e1b4b;font-weight:bold;padding:14px 28px;border-radius:8px;
                    text-decoration:none;margin-bottom:24px;">
            Reset Password
          </a>
          <p style="color:#999;font-size:12px">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color:#555;font-size:11px;word-break:break-all;margin-top:16px">
            ${resetUrl}
          </p>
        </div>`,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}`)
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip   = getIp(request)
    const body = await request.json()
    const { step, password } = body
    const email = ((body.email) || '').toLowerCase().trim()

    if (!email)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    if (!allow(ipBuckets, ip, 5, 15 * 60 * 1000)) return TOO_MANY

    // ── Step 1: check email + either send link or allow direct reset ───────
    if (step === 'check') {
      if (!allow(emailBuckets, email, 3, 60 * 60 * 1000)) return TOO_MANY

      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${email}
      `
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        // ✉️  Email path — send the link, client shows "check your inbox"
        const token    = makeResetToken(email)
        const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`
        await sendResetEmail(email, resetUrl)
        return NextResponse.json({ success: true, emailSent: true })
      }

      // 🔓 No email service — tell client to show password fields directly
      return NextResponse.json({ success: true, emailSent: false })
    }

    // ── Step 2 (no-email fallback): update password directly ──────────────
    if (step === 'reset') {
      if (!password || password.length < 8)
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

      if (!allow(emailBuckets, email, 3, 60 * 60 * 1000)) return TOO_MANY

      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${email}
      `
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

      const hashed = await bcrypt.hash(password, 12)
      await prisma.$executeRaw`UPDATE users SET password = ${hashed} WHERE email = ${email}`
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (err: any) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
