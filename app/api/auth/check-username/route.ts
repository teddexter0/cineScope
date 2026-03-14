// app/api/auth/check-username/route.ts
// Returns whether a username is available (case-insensitive)

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim()

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, error: 'Username too short' })
  }
  if (username.length > 20) {
    return NextResponse.json({ available: false, error: 'Username too long' })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid characters' })
  }

  try {
    // Case-insensitive uniqueness check — no two users may share the same
    // sequence of letters regardless of capitalisation (industry standard)
    const existing = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    })
    return NextResponse.json({ available: !existing })
  } catch {
    return NextResponse.json({ available: false, error: 'Could not check availability' }, { status: 500 })
  }
}
