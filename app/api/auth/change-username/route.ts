// app/api/auth/change-username/route.ts
// Gracefully handles databases where the quota columns don't yet exist.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAX_CHANGES = 5
const COOLDOWN_DAYS = 30

/** Try to fetch user with quota columns; fall back to basic fields if not yet migrated. */
async function fetchUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, usernameChangedAt: true, usernameChangeCount: true },
    })
    return user ? { ...user, hasQuotaCols: true } : null
  } catch {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true },
      })
      if (!user) return null
      return { ...user, usernameChangedAt: null as Date | null, usernameChangeCount: 0, hasQuotaCols: false }
    } catch {
      return null
    }
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const email = session.user.email

    const body = await request.json()
    const trimmed = ((body?.username) || '').trim()

    if (!trimmed || trimmed.length < 3)
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    if (trimmed.length > 20)
      return NextResponse.json({ error: 'Username must be 20 characters or less' }, { status: 400 })
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
      return NextResponse.json({ error: 'Only letters, numbers, and underscores allowed' }, { status: 400 })

    const normalized = trimmed.toLowerCase()

    const user = await fetchUser(email)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (user.username === normalized)
      return NextResponse.json({ error: 'That is already your username' }, { status: 400 })

    if (user.hasQuotaCols) {
      if (user.usernameChangeCount >= MAX_CHANGES) {
        return NextResponse.json({
          error: `You have used all ${MAX_CHANGES} lifetime username changes.`,
          quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS },
        }, { status: 403 })
      }
      if (user.usernameChangedAt) {
        const daysSince = (Date.now() - user.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince < COOLDOWN_DAYS) {
          const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSince)
          return NextResponse.json({
            error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS, daysLeft },
          }, { status: 429 })
        }
      }
    }

    const conflict = await prisma.user.findFirst({
      where: { username: { equals: normalized, mode: 'insensitive' }, id: { not: user.id } },
      select: { id: true },
    })
    if (conflict) return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })

    const updateData: any = { username: normalized }
    if (user.hasQuotaCols) {
      updateData.usernameChangedAt = new Date()
      updateData.usernameChangeCount = { increment: 1 }
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData })

    const usedAfter = user.usernameChangeCount + 1
    return NextResponse.json({
      success: true,
      username: normalized,
      quota: { used: usedAfter, max: MAX_CHANGES, remaining: Math.max(0, MAX_CHANGES - usedAfter), cooldownDays: COOLDOWN_DAYS },
    })
  } catch (err: any) {
    console.error('[change-username PATCH]', err)
    return NextResponse.json({ error: 'Server error', detail: err?.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await fetchUser(session.user.email)
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
  } catch (err: any) {
    console.error('[change-username GET]', err)
    return NextResponse.json({ error: 'Server error', detail: err?.message }, { status: 500 })
  }
}
