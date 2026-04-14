// app/api/movies/rate/route.ts
// FIXED: Always pass authOptions to getServerSession()

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

declare global {
  // eslint-disable-next-line no-var
  var __cineRatings: Map<string, any[]> | undefined
}
const sessionRatings: Map<string, any[]> =
  global.__cineRatings ?? (global.__cineRatings = new Map())

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@user.com'

    const userRatings = sessionRatings.get(userEmail) || []
    console.log('⭐ Getting ratings for:', userEmail, 'Count:', userRatings.length)

    return NextResponse.json({ success: true, ratings: userRatings })
  } catch (error) {
    console.error('❌ Get ratings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get ratings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@user.com'

    const body = await request.json()
    const { movieId, title, poster_path, vote_average, release_date, rating, review, media_type } = body

    const userRatings = sessionRatings.get(userEmail) || []
    const existingIndex = userRatings.findIndex(item => item.movieId === movieId?.toString())

    const ratingItem = {
      id: existingIndex >= 0 ? userRatings[existingIndex].id : Date.now().toString(),
      movieId: movieId?.toString(),
      title,
      poster_path,
      vote_average,
      release_date,
      rating,
      media_type: media_type || 'movie',
      review: review || 'Liked from AI recommendations',
      createdAt: existingIndex >= 0 ? userRatings[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      userRatings[existingIndex] = ratingItem
    } else {
      userRatings.push(ratingItem)
    }

    sessionRatings.set(userEmail, userRatings)

    return NextResponse.json({ success: true, rating: ratingItem, message: `${title} rating saved!` })
  } catch (error: any) {
    console.error('❌ Add rating error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save rating: ' + error.message }, { status: 500 })
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

    const userRatings = sessionRatings.get(userEmail) || []
    sessionRatings.set(userEmail, userRatings.filter(item => item.movieId !== movieId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Remove rating error:', error)
    return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 })
  }
}