// app/api/auth/forgot-password/route.ts
// Generates a signed, time-limited reset token.
// If RESEND_API_KEY is set → sends a real email.
// Otherwise → returns the reset link in the JSON response (usable in demo/dev).

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const SECRET = process.env.NEXTAUTH_SECRET || 'cinescope-reset-secret'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://cine-scope-red.vercel.app'
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export function makeResetToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx < 0) return null
    const payload = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
    // Constant-time compare
    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'ascii'), Buffer.from(expected, 'ascii'))) return null
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!email || !exp || Date.now() > exp) return null
    return { email }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const cleanEmail = email.toLowerCase().trim()

    // Use Prisma model query instead of raw SQL
    let userExists = false
    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true }
      })
      userExists = !!user
    } catch {
      // DB error — still return success to prevent enumeration
    }

    if (!userExists) {
      return NextResponse.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
    }

    const token = makeResetToken(cleanEmail)
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'CineScope <onboarding@resend.dev>',
            to: [email],
            subject: 'Reset your CineScope password',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1a;color:#fff;border-radius:16px;">
                <h1 style="color:#facc15;margin-bottom:8px;">🎬 CineScope</h1>
                <h2 style="margin-bottom:16px;">Reset your password</h2>
                <p style="color:#ccc;margin-bottom:24px;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(to right,#facc15,#f97316);color:#1e1b4b;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px;">Reset Password</a>
                <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `,
          }),
        })
      } catch { /* non-fatal */ }
      return NextResponse.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
    }

    return NextResponse.json({
      success: true,
      message: 'No email service configured — use the reset link below.',
      resetLink: resetUrl,
      expiresInMinutes: 60,
    })
  } catch (err: any) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
