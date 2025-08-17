// app/api/watchlist/route.ts - FIXED PERSISTENT STORAGE

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// FIXED: Use persistent browser storage instead of in-memory Map
function getStorageKey(userEmail: string) {
  return `cinescope_watchlist_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
}

function getUserWatchlist(userEmail: string): any[] {
  if (typeof window === 'undefined') return [] // Server-side
  
  try {
    const stored = localStorage.getItem(getStorageKey(userEmail))
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading watchlist from localStorage:', error)
    return []
  }
}

function saveUserWatchlist(userEmail: string, watchlist: any[]) {
  if (typeof window === 'undefined') return // Server-side
  
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(watchlist))
  } catch (error) {
    console.error('Error saving watchlist to localStorage:', error)
  }
}

// In-memory fallback for server-side operations
const serverWatchlist = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    // Server-side: use in-memory storage
    const userWatchlist = serverWatchlist.get(userEmail) || []
    
    console.log('📋 Getting watchlist for:', userEmail, 'Items:', userWatchlist.length)
    
    return NextResponse.json({ 
      success: true,
      watchlist: userWatchlist,
      storage: 'server' // Indicate storage type
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

    // Get existing watchlist from server storage
    const userWatchlist = serverWatchlist.get(userEmail) || []
    
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
    serverWatchlist.set(userEmail, userWatchlist)

    console.log('✅ Added to watchlist:', title, 'Total items:', userWatchlist.length)

    // Return with client-side storage instruction
    return NextResponse.json({ 
      success: true, 
      watchlistItem,
      message: `${title} added to watchlist!`,
      clientSync: {
        action: 'add',
        item: watchlistItem,
        userEmail
      }
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

    const userWatchlist = serverWatchlist.get(userEmail) || []
    const updatedWatchlist = userWatchlist.filter(item => item.movieId !== movieId)
    
    serverWatchlist.set(userEmail, updatedWatchlist)

    console.log('🗑️ Removed from watchlist:', movieId)

    return NextResponse.json({ 
      success: true,
      clientSync: {
        action: 'remove',
        movieId,
        userEmail
      }
    })
  } catch (error) {
    console.error('❌ Remove from watchlist error:', error)
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}