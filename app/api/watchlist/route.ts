// Create: app/api/watchlist/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { movie: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({ watchlists })

  } catch (error) {
    console.error('Watchlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

// Add movie to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { movieId, status = 'to_watch', notes = '', priority = 0 } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create default watchlist
    let watchlist = await prisma.watchlist.findFirst({
      where: { userId: user.id, isDefault: true }
    })

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          userId: user.id,
          name: 'My Watchlist',
          isDefault: true
        }
      })
    }

    // Check if movie already in watchlist
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        watchlistId: watchlist.id,
        movieId: movieId.toString()
      }
    })

    if (existingItem) {
      return NextResponse.json({ error: 'Movie already in watchlist' }, { status: 400 })
    }

    // Add movie to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        movieId: movieId.toString(),
        status,
        notes,
        priority
      }
    })

    return NextResponse.json({ success: true, item: watchlistItem })

  } catch (error) {
    console.error('Add to watchlist error:', error)
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 })
  }
}
