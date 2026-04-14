// app/api/watchlist/route.ts
// FIXED:
//  1. Always pass authOptions to getServerSession() so JWT is decoded correctly
//  2. Removed the dead localStorage code (window is undefined server-side)
//  3. In-memory map is the single source of truth for server-side storage

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In-memory storage (survives hot-reload in dev, resets on cold restart)
declare global {
  // eslint-disable-next-line no-var
  var __cineWatchlist: Map<string, any[]> | undefined
}
const serverWatchlist: Map<string, any[]> =
  global.__cineWatchlist ?? (global.__cineWatchlist = new Map())

export async function GET(request: NextRequest) {
  try {
    // FIXED: pass authOptions so getServerSession can decode the JWT
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@user.com'

    const userWatchlist = serverWatchlist.get(userEmail) || []
    console.log('📋 Getting watchlist for:', userEmail, 'Items:', userWatchlist.length)

    return NextResponse.json({
      success: true,
      watchlist: userWatchlist,
    })
  } catch (error) {
    console.error('❌ Get watchlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get watchlist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@user.com'

    const body = await request.json()
    const { movieId, title, poster_path, vote_average, release_date, overview, media_type } = body

    const userWatchlist = serverWatchlist.get(userEmail) || []

    // Prevent duplicates
    const exists = userWatchlist.find(item => item.movieId === movieId?.toString())
    if (exists) {
      return NextResponse.json({ success: false, error: 'Movie already in watchlist' }, { status: 400 })
    }

    const watchlistItem = {
      id: Date.now().toString(),
      movieId: movieId?.toString(),
      title,
      poster_path,
      vote_average,
      release_date,
      overview,
      media_type: media_type || 'movie',
      status: 'to_watch',
      addedAt: new Date().toISOString(),
    }

    userWatchlist.push(watchlistItem)
    serverWatchlist.set(userEmail, userWatchlist)

    console.log('✅ Added to watchlist:', title, 'Total:', userWatchlist.length)

    return NextResponse.json({
      success: true,
      watchlistItem,
      message: `${title} added to watchlist!`,
    })
  } catch (error: any) {
    console.error('❌ Add to watchlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add to watchlist: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@user.com'

    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'movieId required' }, { status: 400 })
    }

    const userWatchlist = serverWatchlist.get(userEmail) || []
    const updated = userWatchlist.filter(item => item.movieId !== movieId)
    serverWatchlist.set(userEmail, updated)

    console.log('🗑️ Removed from watchlist:', movieId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Remove from watchlist error:', error)
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}