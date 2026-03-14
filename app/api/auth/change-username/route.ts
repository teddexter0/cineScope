// app/api/auth/change-username/route.ts
// Industry-standard username change: 5 lifetime changes, 30-day cooldown between changes.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAX_CHANGES = 5           // lifetime quota
const COOLDOWN_DAYS = 30        // days between changes

export async function PATCH(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { username } = await request.json()
  const trimmed = (username || '').trim()

  // Format validation
  if (!trimmed || trimmed.length < 3) return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
  if (trimmed.length > 20) return NextResponse.json({ error: 'Username must be 20 characters or less' }, { status: 400 })
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return NextResponse.json({ error: 'Only letters, numbers, and underscores allowed' }, { status: 400 })

  const normalized = trimmed.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true, usernameChangedAt: true, usernameChangeCount: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // No-op if same username
  if (user.username === normalized) return NextResponse.json({ error: 'That is already your username' }, { status: 400 })

  // Lifetime quota check
  if (user.usernameChangeCount >= MAX_CHANGES) {
    return NextResponse.json({
      error: `You have used all ${MAX_CHANGES} lifetime username changes.`,
      quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS },
    }, { status: 403 })
  }

  // Cooldown check
  if (user.usernameChangedAt) {
    const daysSinceChange = (Date.now() - user.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceChange < COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSinceChange)
      return NextResponse.json({
        error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS, daysLeft },
      }, { status: 429 })
    }
  }

  // Uniqueness check (case-insensitive)
  const conflict = await prisma.user.findFirst({
    where: { username: { equals: normalized, mode: 'insensitive' }, id: { not: user.id } },
    select: { id: true },
  })
  if (conflict) return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })

  // Commit
  await prisma.user.update({
    where: { id: user.id },
    data: {
      username: normalized,
      usernameChangedAt: new Date(),
      usernameChangeCount: { increment: 1 },
    },
  })

  const remaining = MAX_CHANGES - (user.usernameChangeCount + 1)
  return NextResponse.json({
    success: true,
    username: normalized,
    quota: { used: user.usernameChangeCount + 1, max: MAX_CHANGES, remaining, cooldownDays: COOLDOWN_DAYS },
  })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { username: true, usernameChangedAt: true, usernameChangeCount: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let daysLeft = 0
  if (user.usernameChangedAt) {
    const daysSince = (Date.now() - user.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    daysLeft = Math.max(0, Math.ceil(COOLDOWN_DAYS - daysSince))
  }

  return NextResponse.json({
    username: user.username,
    quota: {
      used: user.usernameChangeCount,
      max: MAX_CHANGES,
      remaining: Math.max(0, MAX_CHANGES - user.usernameChangeCount),
      cooldownDays: COOLDOWN_DAYS,
      daysLeft,
      canChange: user.usernameChangeCount < MAX_CHANGES && daysLeft === 0,
    },
  })
}
