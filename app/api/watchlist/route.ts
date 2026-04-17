import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getOrCreateDefaultWatchlist,
  mapWatchlistItem,
  upsertMediaRecord,
} from '@/lib/media-persistence'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const userWatchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: [
        { watchedAt: 'desc' },
        { addedAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      watchlist: userWatchlist.map(mapWatchlistItem),
    })
  } catch (error) {
    console.error('Get watchlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get watchlist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const movie = await upsertMediaRecord(body)
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: movie.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Movie already in watchlist' }, { status: 400 })
    }

    const defaultWatchlist = await getOrCreateDefaultWatchlist(userId)
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId,
        movieId: movie.id,
        watchlistId: defaultWatchlist.id,
        status: 'to_watch',
      },
      include: { movie: true },
    })

    return NextResponse.json({
      success: true,
      watchlistItem: mapWatchlistItem(watchlistItem),
      message: `${movie.title} added to watchlist!`,
    })
  } catch (error: any) {
    console.error('Add to watchlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add to watchlist: ' + error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const movie = await prisma.movie.findUnique({
      where: { tmdbId: Number(body.movieId) },
    })

    if (!movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 })
    }

    const watchlistItem = await prisma.watchlistItem.update({
      where: {
        userId_movieId: {
          userId,
          movieId: movie.id,
        },
      },
      data: {
        status: body.status === 'watched' ? 'watched' : 'to_watch',
        watchedAt: body.status === 'watched' ? new Date() : null,
      },
      include: { movie: true },
    })

    return NextResponse.json({
      success: true,
      watchlistItem: mapWatchlistItem(watchlistItem),
    })
  } catch (error) {
    console.error('Update watchlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update watchlist item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'movieId required' }, { status: 400 })
    }

    const movie = await prisma.movie.findUnique({
      where: { tmdbId: Number(movieId) },
    })

    if (!movie) {
      return NextResponse.json({ success: true })
    }

    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        movieId: movie.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove from watchlist error:', error)
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}
