// app/api/auth/forgot-password/route.ts
// Step 1: verify email exists in DB
// Step 2: update password directly — same DB path as signup

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { step, email, password } = await request.json()
    const normalizedEmail = (email || '').toLowerCase().trim()

    if (!normalizedEmail)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // ── Step 1: check the email exists ────────────────────────────────────
    if (step === 'check') {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${normalizedEmail}
      `
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    // ── Step 2: update the password ───────────────────────────────────────
    if (step === 'reset') {
      if (!password || password.length < 8)
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${normalizedEmail}
      `
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

      const hashed = await bcrypt.hash(password, 12)
      await prisma.$executeRaw`
        UPDATE users SET password = ${hashed} WHERE email = ${normalizedEmail}
      `
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (err: any) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
