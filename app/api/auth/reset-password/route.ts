// app/api/auth/reset-password/route.ts
// Verifies the HMAC reset token and updates the user's password.

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyResetToken } from '../forgot-password/route'

const prisma = new PrismaClient()

async function findUserIdByEmailInsensitive(email: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM users
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `
  return rows[0]?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password)
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const payload = verifyResetToken(token)
    if (!payload)
      return NextResponse.json({ error: 'Reset link is invalid or has expired. Please request a new one.' }, { status: 400 })

    const email = payload.email.toLowerCase().trim()
    const hashed = await bcrypt.hash(password, 12)

    const userId = await findUserIdByEmailInsensitive(email)
    console.log('[reset-password] resolved user id:', userId, 'type:', typeof userId)

    if (!userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    const updated = await prisma.$queryRaw<Array<{ password: string | null }>>`
      SELECT password FROM users WHERE id = ${userId} LIMIT 1
    `
    console.log('[reset-password] password updated, hash length:', updated[0]?.password?.length)

    return NextResponse.json({ success: true, message: 'Password updated. You can now sign in.' })
  } catch (err: any) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
