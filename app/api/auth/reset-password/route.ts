// app/api/auth/reset-password/route.ts
// Used when RESEND_API_KEY is set — verifies the emailed HMAC token, then
// updates the password. Same raw-SQL approach as the rest of the auth routes.

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyResetToken } from '@/lib/reset-token'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password)
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const payload = verifyResetToken(token)
    if (!payload)
      return NextResponse.json(
        { error: 'Reset link has expired or is invalid. Please request a new one.' },
        { status: 400 }
      )

    const hashed = await bcrypt.hash(password, 12)
    await prisma.$executeRaw`UPDATE users SET password = ${hashed} WHERE email = ${payload.email}`

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
