// app/api/auth/check-email/route.ts
// Returns whether an email is registered — used to give smart signin error messages

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Demo account bypass
    if (email === 'test@cinescope.com') {
      return NextResponse.json({ exists: true })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      // Explicitly return false when user is not found
      return NextResponse.json({ exists: !!user })
    } catch (dbError) {
      // FIXED: Don't silently return exists:true on DB errors.
      // Return a specific error so the signin page can fall through to
      // normal signIn() rather than showing a misleading "account not found".
      console.error('check-email DB error:', dbError)
      return NextResponse.json({ exists: null, dbError: true })
    }

  } catch (error) {
    console.error('check-email error:', error)
    return NextResponse.json({ exists: null, dbError: true })
  }
}