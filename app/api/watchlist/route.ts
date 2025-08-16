// app/api/watchlist/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

// Since we don't have Prisma set up, let's use a simple in-memory solution
// In production, you'd use a real database

// Temporary in-memory storage (resets on server restart)
const tempWatchlist: Record<string, any[]> = {}

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll use session data or a default user
    const userEmail = 'demo@user.com' // In real app, get from session
    
    const userWatchlist = tempWatchlist[userEmail] || []
    
    return NextResponse.json({ 
      success: true,
      watchlists: [{
        id: 'default',
        name: 'My Watchlist',
        items: userWatchlist
      }]
    })

  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch watchlist' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, status = 'to_watch', notes = '', priority = 0 } = body

    // For demo purposes, we'll use a default user
    const userEmail = 'demo@user.com' // In real app, get from session

    // Initialize user watchlist if doesn't exist
    if (!tempWatchlist[userEmail]) {
      tempWatchlist[userEmail] = []
    }

    // Check if movie already in watchlist
    const existingIndex = tempWatchlist[userEmail].findIndex(
      item => item.movieId === movieId.toString()
    )

    if (existingIndex !== -1) {
      return NextResponse.json({ 
        success: false,
        error: 'Movie already in watchlist' 
      }, { status: 400 })
    }

    // Add movie to watchlist
    const watchlistItem = {
      id: Date.now().toString(), // Simple ID generation
      movieId: movieId.toString(),
      status,
      notes,
      priority,
      createdAt: new Date().toISOString()
    }

    tempWatchlist[userEmail].push(watchlistItem)

    console.log('✅ Movie added to watchlist:', watchlistItem)

    return NextResponse.json({ 
      success: true, 
      item: watchlistItem,
      message: 'Added to watchlist successfully!'
    })

  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to add to watchlist: ' + error.message 
    }, { status: 500 })
  }
}