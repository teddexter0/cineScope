
// Create the missing API route: app/api/movies/rate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { movieId, rating, review } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or update rating
    const movieRating = await prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId: movieId.toString()
        }
      },
      update: {
        rating,
        review 
      },
      create: {
        userId: user.id,
        movieId: movieId.toString(),
        rating,
        review
      }
    })

    // Log interaction for AI learning
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        action: 'movie_rated',
        target: movieId.toString(),
        context: {
          rating,
          review,
          source: 'recommendations'
        }
      }
    })

    return NextResponse.json({ success: true, rating: movieRating })

  } catch (error) {
    console.error('Movie rating error:', error)
    return NextResponse.json({ error: 'Failed to rate movie' }, { status: 500 })
  }
}