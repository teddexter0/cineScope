import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapRatingItem, upsertMediaRecord } from '@/lib/media-persistence'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const userRatings = await prisma.rating.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, ratings: userRatings.map(mapRatingItem) })
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get ratings' }, { status: 500 })
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
    const ratingItem = await prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId: movie.id,
        },
      },
      update: {
        rating: Number(body.rating),
        review: body.review || 'Liked from AI recommendations',
      },
      create: {
        userId,
        movieId: movie.id,
        rating: Number(body.rating),
        review: body.review || 'Liked from AI recommendations',
      },
      include: { movie: true },
    })

    return NextResponse.json({
      success: true,
      rating: mapRatingItem(ratingItem),
      message: `${movie.title} rating saved!`,
    })
  } catch (error: any) {
    console.error('Add rating error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save rating: ' + error.message }, { status: 500 })
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

    await prisma.rating.deleteMany({
      where: {
        userId,
        movieId: movie.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove rating error:', error)
    return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 })
  }
}
