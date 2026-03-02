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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // only need to know it exists
    })

    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error('check-email error:', error)
    // On DB error, return exists:true so we fall through to normal signIn
    // (better to show "wrong password" than a confusing error)
    return NextResponse.json({ exists: true })
  }
}
