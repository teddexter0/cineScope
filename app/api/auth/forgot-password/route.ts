import { NextRequest, NextResponse } from 'next/server'
import { sendFirebasePasswordReset, usesFirebaseAuth } from '@/lib/firebase-auth'
import { prisma } from '@/lib/prisma'
import { makeResetToken } from '@/lib/reset-token'

const success = { success: true, message: 'If that email is registered, a reset link has been sent.' }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (usesFirebaseAuth()) {
      await sendFirebasePasswordReset(email)
      return NextResponse.json(success)
    }

    const { RESEND_API_KEY, NEXTAUTH_URL, NEXTAUTH_SECRET } = process.env
    if (!RESEND_API_KEY || !NEXTAUTH_URL || !NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Password reset is temporarily unavailable.' }, { status: 503 })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, isActive: true },
      select: { email: true },
    })
    if (user) {
      const resetUrl = new URL('/auth/reset-password', NEXTAUTH_URL)
      resetUrl.searchParams.set('token', makeResetToken(email))
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'CineScope <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Reset your CineScope password',
          text: `Open this link within one hour to reset your CineScope password: ${resetUrl}`,
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) console.error('[forgot-password] Mail provider rejected request:', response.status)
    }
    return NextResponse.json(success)
  } catch (error) {
    console.error('[forgot-password]', error)
    return NextResponse.json({ error: 'Password reset is temporarily unavailable.' }, { status: 503 })
  }
}
