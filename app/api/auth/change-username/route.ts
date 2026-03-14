// app/api/auth/change-username/route.ts
// Uses raw SQL to bypass Prisma generated-type issues when quota columns
// haven't been added to the DB yet (migration pending).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAX_CHANGES = 5
const COOLDOWN_DAYS = 30

interface UserRow {
  id: string
  username: string | null
  usernameChangedAt: Date | null
  usernameChangeCount: number
  hasQuotaCols: boolean
}

/** Raw SQL fetch — works whether or not quota columns exist in the DB. */
async function fetchUser(email: string): Promise<UserRow | null> {
  // Try with quota columns first
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, username,
             username_changed_at   AS "usernameChangedAt",
             username_change_count AS "usernameChangeCount"
      FROM   users
      WHERE  email = ${email}
    `
    if (!rows.length) return null
    return { ...rows[0], hasQuotaCols: true }
  } catch {
    // Quota columns don't exist yet — fall back to basics
    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT id, username FROM users WHERE email = ${email}
      `
      if (!rows.length) return null
      return { ...rows[0], usernameChangedAt: null, usernameChangeCount: 0, hasQuotaCols: false }
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
      if ((user.usernameChangeCount ?? 0) >= MAX_CHANGES) {
        return NextResponse.json({
          error: `You have used all ${MAX_CHANGES} lifetime username changes.`,
          quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS },
        }, { status: 403 })
      }
      if (user.usernameChangedAt) {
        const daysSince = (Date.now() - new Date(user.usernameChangedAt).getTime()) / 86_400_000
        if (daysSince < COOLDOWN_DAYS) {
          const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSince)
          return NextResponse.json({
            error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            quota: { used: user.usernameChangeCount, max: MAX_CHANGES, cooldownDays: COOLDOWN_DAYS, daysLeft },
          }, { status: 429 })
        }
      }
    }

    // Uniqueness check — raw SQL, case-insensitive
    const conflict = await prisma.$queryRaw<any[]>`
      SELECT id FROM users
      WHERE LOWER(username) = LOWER(${normalized}) AND id != ${user.id}
    `
    if (conflict.length > 0)
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })

    // Commit — update quota columns only if they exist
    if (user.hasQuotaCols) {
      await prisma.$executeRaw`
        UPDATE users
        SET    username              = ${normalized},
               username_changed_at  = NOW(),
               username_change_count = COALESCE(username_change_count, 0) + 1
        WHERE  id = ${user.id}
      `
    } else {
      await prisma.$executeRaw`
        UPDATE users SET username = ${normalized} WHERE id = ${user.id}
      `
    }

    const usedAfter = (user.usernameChangeCount ?? 0) + 1
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
      const daysSince = (Date.now() - new Date(user.usernameChangedAt).getTime()) / 86_400_000
      daysLeft = Math.max(0, Math.ceil(COOLDOWN_DAYS - daysSince))
    }

    const used = user.usernameChangeCount ?? 0
    return NextResponse.json({
      username: user.username,
      quota: {
        used,
        max: MAX_CHANGES,
        remaining: Math.max(0, MAX_CHANGES - used),
        cooldownDays: COOLDOWN_DAYS,
        daysLeft,
        canChange: used < MAX_CHANGES && daysLeft === 0,
      },
    })
  } catch (err: any) {
    console.error('[change-username GET]', err)
    return NextResponse.json({ error: 'Server error', detail: err?.message }, { status: 500 })
  }
}
