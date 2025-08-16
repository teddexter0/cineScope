
// app/api/watchlist/route.ts - REPLACE ENTIRE FILE

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Simple in-memory storage that actually persists during session
const sessionWatchlist = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const userWatchlist = sessionWatchlist.get(userEmail) || []
    
    console.log('📋 Getting watchlist for:', userEmail, 'Items:', userWatchlist.length)
    
    return NextResponse.json({ 
      success: true,
      watchlist: userWatchlist
    })
  } catch (error) {
    console.error('❌ Get watchlist error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get watchlist' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const body = await request.json()
    const { movieId, title, poster_path, vote_average, release_date, overview } = body

    // Get existing watchlist
    const userWatchlist = sessionWatchlist.get(userEmail) || []
    
    // Check if already exists
    const exists = userWatchlist.find(item => item.movieId === movieId?.toString())
    if (exists) {
      return NextResponse.json({ 
        success: false,
        error: 'Movie already in watchlist' 
      }, { status: 400 })
    }

    // Add to watchlist
    const watchlistItem = {
      id: Date.now().toString(),
      movieId: movieId?.toString(),
      title,
      poster_path,
      vote_average,
      release_date,
      overview,
      addedAt: new Date().toISOString()
    }

    userWatchlist.push(watchlistItem)
    sessionWatchlist.set(userEmail, userWatchlist)

    console.log('✅ Added to watchlist:', title, 'Total items:', userWatchlist.length)

    return NextResponse.json({ 
      success: true, 
      watchlistItem,
      message: `${title} added to watchlist!`
    })
  } catch (error) {
    console.error('❌ Add to watchlist error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to add to watchlist: ' + error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'movieId required' }, { status: 400 })
    }

    const userWatchlist = sessionWatchlist.get(userEmail) || []
    const updatedWatchlist = userWatchlist.filter(item => item.movieId !== movieId)
    
    sessionWatchlist.set(userEmail, updatedWatchlist)

    console.log('🗑️ Removed from watchlist:', movieId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Remove from watchlist error:', error)
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}
