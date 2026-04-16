// app/api/auth/forgot-password/route.ts
// FIXED: derives base URL from request headers (not NEXTAUTH_URL)

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma  = new PrismaClient()
const SECRET  = process.env.NEXTAUTH_SECRET || 'cinescope-reset-secret'
const TTL     = 60 * 60 * 1000 // 1 hour

function getBaseUrl(req: NextRequest): string {
  const fwdHost  = req.headers.get('x-forwarded-host')
  const host     = fwdHost || req.headers.get('host') || 'localhost:3000'
  const proto    = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  // Strip port from proto if Vercel sends "https,https" (rare but happens)
  const cleanProto = proto.split(',')[0].trim()
  return `${cleanProto}://${host}`
}

export function makeResetToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + TTL })).toString('base64url')
  const sig     = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const dot     = token.lastIndexOf('.')
    if (dot < 0) return null
    const payload = token.slice(0, dot)
    const sig     = token.slice(dot + 1)
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig,'ascii'), Buffer.from(expected,'ascii'))) return null
    const { email, exp } = JSON.parse(Buffer.from(payload,'base64url').toString('utf8'))
    if (!email || !exp || Date.now() > exp) return null
    return { email }
  } catch { return null }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const clean = email.toLowerCase().trim()
    let userId: string | null = null
    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: clean, mode: 'insensitive' } },
        select: { id: true, email: true },
      })
      userId = user?.id ?? null
    } catch {}

    if (!userId) return NextResponse.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })

    const token    = makeResetToken(clean)
    const baseUrl  = getBaseUrl(request)          // ← always the real public domain
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'CineScope <onboarding@resend.dev>',
            to: [email],
            subject: 'Reset your CineScope password',
            html: `<div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1a;color:#fff;border-radius:16px;"><h1 style="color:#facc15;margin-bottom:8px;letter-spacing:-0.03em;">CineScope</h1><h2 style="margin-bottom:16px;font-weight:600;">Reset your password</h2><p style="color:#aaa;margin-bottom:24px;line-height:1.6;">Click below to reset your password. This link expires in <strong>1 hour</strong>.</p><a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#facc15,#f97316);color:#1a0f00;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Reset Password</a><p style="color:#555;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p></div>`,
          }),
        })
      } catch {}
      return NextResponse.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
    }

    // No email service — return link directly (dev/demo)
    return NextResponse.json({ success: true, message: 'No email service — use the link below.', resetLink: resetUrl, expiresInMinutes: 60 })
  } catch (err: any) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
