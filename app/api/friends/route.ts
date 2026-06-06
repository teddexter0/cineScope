// app/api/friends/route.ts
// Database-backed social features: friends (Follow table), activity feed and
// leaderboard (derived from WatchlistItem + Movie), and user search.
//
// Identity comes from the server session (NextAuth) — the client no longer needs
// to pass its own email. The legacy `register` and `activity` POST actions are kept
// as harmless no-ops so older client code keeps working; activity is now derived
// from persisted watchlist data instead of an in-memory log.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapMovieMediaType } from '@/lib/media-persistence'

interface UserProfile { email: string; name: string; username: string }

interface DerivedEvent {
  id: string
  userId: string
  userEmail: string
  username: string
  name: string
  action: 'added' | 'watched'
  title: string
  mediaType: 'movie' | 'tv'
  posterPath: string | null
  timestamp: string
}

function usernameFrom(email: string, name: string): string {
  // Prefer the part before @ but fall back to sanitised name
  return email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || name.toLowerCase().replace(/\s+/g, '.')
}

/** Map a Prisma User row to the UserProfile shape used by the client. */
function profileFromDbUser(u: { email: string; name: string | null; username: string | null }): UserProfile {
  return {
    email: u.email,
    name: u.name || u.email,
    username: u.username || usernameFrom(u.email, u.name || ''),
  }
}

/** Levenshtein edit distance — used for fuzzy search ranking */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** Score a user against a query. Lower = better match. Returns Infinity if no reasonable match. */
function matchScore(u: UserProfile, q: string): number {
  const fields = [u.username, u.name.toLowerCase(), u.email.split('@')[0]]
  // Exact match on any field
  if (fields.some(f => f === q)) return 0
  // Substring / prefix match on any field
  if (fields.some(f => f.includes(q) || q.includes(f.substring(0, Math.max(q.length - 1, 2))))) return 1
  // Fuzzy: min Levenshtein distance between query and each field (truncated to query length)
  const minDist = Math.min(...fields.map(f => levenshtein(q, f.substring(0, q.length + 3))))
  // Allow up to 2 edits for queries ≥4 chars, 1 edit for shorter
  const threshold = q.length >= 4 ? 2 : 1
  return minDist <= threshold ? minDist + 2 : Infinity
}

/** Resolve the signed-in user from the session, or null if unauthenticated. */
async function getMe(): Promise<{ id: string; email: string; name: string | null; username: string | null } | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as any)?.id as string | undefined
  const email = session?.user?.email
  if (!id || !email) return null
  return {
    id,
    email,
    name: session.user?.name ?? null,
    username: (session.user as any)?.username ?? null,
  }
}

/** Build activity events for a set of users, newest first, derived from watchlist data. */
async function buildEvents(userIds: string[]): Promise<DerivedEvent[]> {
  if (userIds.length === 0) return []
  const items = await prisma.watchlistItem.findMany({
    where: { userId: { in: userIds } },
    include: {
      movie: true,
      user: { select: { id: true, email: true, name: true, username: true } },
    },
    orderBy: { addedAt: 'desc' },
    take: 300,
  })

  const events: DerivedEvent[] = []
  for (const it of items) {
    const profile = profileFromDbUser(it.user)
    const base = {
      userId: it.user.id,
      userEmail: profile.email,
      username: profile.username,
      name: profile.name,
      title: it.movie.title,
      mediaType: mapMovieMediaType(it.movie) as 'movie' | 'tv',
      posterPath: it.movie.posterPath,
    }
    // Every item is an "added" event; a watched item additionally emits a "watched" event.
    events.push({ ...base, id: `${it.id}-added`, action: 'added', timestamp: it.addedAt.toISOString() })
    if (it.status === 'watched' && it.watchedAt) {
      events.push({ ...base, id: `${it.id}-watched`, action: 'watched', timestamp: it.watchedAt.toISOString() })
    }
  }
  // ISO 8601 strings sort lexicographically in chronological order.
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return events
}

// ── POST /api/friends ─────────────────────────────────────────────────────────
// body: { action: 'register'|'add'|'remove'|'activity', ...payload }
export async function POST(request: NextRequest) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    // Legacy no-ops: users live in the DB from signup; activity is derived from
    // watchlist data. Kept so existing client calls still succeed.
    if (action === 'register' || action === 'activity') {
      return NextResponse.json({ success: true, username: me.username || usernameFrom(me.email, me.name || '') })
    }

    // Follow a user, resolved by username / email / display name.
    if (action === 'add') {
      const { query } = body
      if (!query) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

      const q = String(query).toLowerCase().trim()
      const target = await prisma.user.findFirst({
        where: {
          isActive: true,
          OR: [
            { username: { equals: q, mode: 'insensitive' } },
            { email: { equals: q, mode: 'insensitive' } },
            { name: { equals: String(query).trim(), mode: 'insensitive' } },
          ],
        },
        select: { id: true, email: true, name: true, username: true },
      })

      if (!target) return NextResponse.json({ success: false, error: 'User not found' })
      if (target.id === me.id) return NextResponse.json({ success: false, error: "Can't add yourself" })

      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
        create: { followerId: me.id, followingId: target.id },
        update: {},
      })
      return NextResponse.json({ success: true, friend: profileFromDbUser(target) })
    }

    // Unfollow a user (client sends the friend's email).
    if (action === 'remove') {
      const { friendEmail } = body
      if (friendEmail) {
        const target = await prisma.user.findFirst({
          where: { email: { equals: String(friendEmail), mode: 'insensitive' } },
          select: { id: true },
        })
        if (target) {
          await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: target.id } })
        }
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── GET /api/friends?view=friends|activity|leaderboard|search&q=<query> ──────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'friends'

  // Search is the only view usable before adding friends; it still needs a session
  // to exclude the searcher, but degrades gracefully if there isn't one.
  if (view === 'search') {
    const me = await getMe()
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    if (q.length < 2) return NextResponse.json({ success: true, results: [] })

    // The database is the source of truth — every signed-up user is here regardless
    // of whether they've opened the Social page. Broad case-insensitive `contains`
    // covers exact/prefix/substring; matchScore adds fuzzy/typo ranking below.
    let candidates: UserProfile[] = []
    try {
      const rows = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { email: true, name: true, username: true },
        take: 50,
      })
      candidates = rows.map(profileFromDbUser)
    } catch {
      candidates = []
    }

    const scored = candidates
      .filter(u => u.email !== me?.email)
      .map(u => ({ u, score: matchScore(u, q) }))
      .filter(({ score }) => score < Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map(({ u }) => u)

    return NextResponse.json({ success: true, results: scored })
  }

  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // IDs of everyone the current user follows.
  const follows = await prisma.follow.findMany({
    where: { followerId: me.id },
    include: { following: { select: { id: true, email: true, name: true, username: true } } },
  })
  const followIds = follows.map(f => f.following.id)

  if (view === 'friends') {
    const friends = follows.map(f => profileFromDbUser(f.following))
    return NextResponse.json({ success: true, friends })
  }

  if (view === 'activity') {
    const events = await buildEvents([me.id, ...followIds])
    return NextResponse.json({ success: true, activity: events.slice(0, 60) })
  }

  if (view === 'leaderboard') {
    const groupIds = [me.id, ...followIds]
    const users = await prisma.user.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, email: true, name: true, username: true },
    })
    const events = await buildEvents(groupIds)
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000

    const counts: Record<string, { profile: UserProfile; count: number; recentTitles: string[] }> = {}
    for (const u of users) counts[u.id] = { profile: profileFromDbUser(u), count: 0, recentTitles: [] }
    for (const e of events) {
      if (new Date(e.timestamp).getTime() <= cutoff) continue
      const entry = counts[e.userId]
      if (!entry) continue
      entry.count++
      if (entry.recentTitles.length < 3 && !entry.recentTitles.includes(e.title)) {
        entry.recentTitles.push(e.title)
      }
    }

    const leaderboard = Object.values(counts).sort((a, b) => b.count - a.count)
    return NextResponse.json({ success: true, leaderboard })
  }

  return NextResponse.json({ error: 'unknown view' }, { status: 400 })
}
