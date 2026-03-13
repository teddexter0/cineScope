// app/api/friends/route.ts
// In-memory friends registry + activity log (survives hot-reload, resets on cold restart)

import { NextRequest, NextResponse } from 'next/server'

// Global in-memory stores (module-level = shared across requests in the same process)
interface UserProfile { email: string; name: string; username: string }
interface ActivityItem {
  id: string
  userEmail: string
  username: string
  name: string
  action: 'added' | 'watched'
  title: string
  mediaType: 'movie' | 'tv'
  posterPath: string | null
  timestamp: string
}

declare global {
  // eslint-disable-next-line no-var
  var __cineUserRegistry: Map<string, UserProfile> | undefined
  // eslint-disable-next-line no-var
  var __cineFriendships: Map<string, Set<string>> | undefined
  // eslint-disable-next-line no-var
  var __cineActivity: ActivityItem[] | undefined
}

// Attach to global to survive Next.js hot-reload in dev
const userRegistry: Map<string, UserProfile> =
  global.__cineUserRegistry ?? (global.__cineUserRegistry = new Map())
const friendships: Map<string, Set<string>> =
  global.__cineFriendships ?? (global.__cineFriendships = new Map())
const activityLog: ActivityItem[] =
  global.__cineActivity ?? (global.__cineActivity = [])

function usernameFrom(email: string, name: string): string {
  // Prefer the part before @ but fall back to sanitised name
  return email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || name.toLowerCase().replace(/\s+/g, '.')
}

function getSession(request: NextRequest): string | null {
  // Read email from query param (passed explicitly from client since we can't use server session easily)
  return request.nextUrl.searchParams.get('me') || null
}

// ── POST /api/friends ─────────────────────────────────────────────────────────
// body: { action: 'register'|'add'|'remove'|'activity', ...payload }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Register user profile
    if (action === 'register') {
      const { email, name } = body
      if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
      const username = usernameFrom(email, name || email)
      userRegistry.set(email, { email, name: name || email, username })
      if (!friendships.has(email)) friendships.set(email, new Set())
      return NextResponse.json({ success: true, username })
    }

    // Add friend by username or email prefix
    if (action === 'add') {
      const { myEmail, query } = body
      if (!myEmail || !query) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

      const q = query.toLowerCase()
      const found = [...userRegistry.values()].find(
        u => u.username === q || u.email.split('@')[0].toLowerCase() === q || u.email === q || u.name.toLowerCase() === q
      )
      if (!found) return NextResponse.json({ success: false, error: 'User not found' })
      if (found.email === myEmail) return NextResponse.json({ success: false, error: "Can't add yourself" })

      if (!friendships.has(myEmail)) friendships.set(myEmail, new Set())
      friendships.get(myEmail)!.add(found.email)
      return NextResponse.json({ success: true, friend: found })
    }

    // Remove friend
    if (action === 'remove') {
      const { myEmail, friendEmail } = body
      friendships.get(myEmail)?.delete(friendEmail)
      return NextResponse.json({ success: true })
    }

    // Log an activity
    if (action === 'activity') {
      const { userEmail, name, verb, title, mediaType, posterPath } = body
      const profile = userRegistry.get(userEmail)
      const item: ActivityItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        userEmail,
        username: profile?.username || usernameFrom(userEmail, name || ''),
        name: name || profile?.name || userEmail,
        action: (verb === 'watched' ? 'watched' : 'added') as 'added' | 'watched',
        title,
        mediaType,
        posterPath: posterPath || null,
        timestamp: new Date().toISOString(),
      }
      activityLog.unshift(item)
      if (activityLog.length > 500) activityLog.length = 500 // circular buffer
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── GET /api/friends?me=<email>&view=friends|activity|search&q=<query> ────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const myEmail = searchParams.get('me') || ''
  const view = searchParams.get('view') || 'friends'

  if (view === 'friends') {
    const myFriends = [...(friendships.get(myEmail) || [])].map(email => userRegistry.get(email)).filter(Boolean)
    return NextResponse.json({ success: true, friends: myFriends })
  }

  if (view === 'activity') {
    const myFriendEmails = new Set(friendships.get(myEmail) || [])
    myFriendEmails.add(myEmail) // include own activity too
    const feed = activityLog.filter(item => myFriendEmails.has(item.userEmail)).slice(0, 60)
    return NextResponse.json({ success: true, activity: feed })
  }

  if (view === 'leaderboard') {
    const myFriendEmails = [...(friendships.get(myEmail) || []), myEmail]
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const counts: Record<string, { profile: UserProfile; count: number; recentTitles: string[] }> = {}

    for (const email of myFriendEmails) {
      const profile = userRegistry.get(email)
      if (!profile) continue
      const recentItems = activityLog.filter(
        a => a.userEmail === email && new Date(a.timestamp).getTime() > sevenDaysAgo
      )
      counts[email] = {
        profile,
        count: recentItems.length,
        recentTitles: [...new Set(recentItems.map(a => a.title))].slice(0, 3),
      }
    }

    const leaderboard = Object.values(counts).sort((a, b) => b.count - a.count)
    return NextResponse.json({ success: true, leaderboard })
  }

  if (view === 'search') {
    const q = (searchParams.get('q') || '').toLowerCase()
    if (q.length < 2) return NextResponse.json({ success: true, results: [] })
    const results = [...userRegistry.values()].filter(
      u => u.username.includes(q) || u.name.toLowerCase().includes(q) || u.email.split('@')[0].includes(q)
    ).slice(0, 10)
    return NextResponse.json({ success: true, results })
  }

  return NextResponse.json({ error: 'unknown view' }, { status: 400 })
}
