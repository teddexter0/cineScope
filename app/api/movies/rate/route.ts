// app/api/movies/rate/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'

// Temporary in-memory storage for ratings
const tempRatings: Record<string, any[]> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, rating, review } = body

    // For demo purposes, use default user
    const userEmail = 'demo@user.com'

    // Initialize user ratings if doesn't exist
    if (!tempRatings[userEmail]) {
      tempRatings[userEmail] = []
    }

    // Check if already rated
    const existingIndex = tempRatings[userEmail].findIndex(
      item => item.movieId === movieId.toString()
    )

    const ratingData = {
      id: Date.now().toString(),
      movieId: movieId.toString(),
      rating,
      review,
      createdAt: new Date().toISOString()
    }

    if (existingIndex !== -1) {
      // Update existing rating
      tempRatings[userEmail][existingIndex] = ratingData
    } else {
      // Add new rating
      tempRatings[userEmail].push(ratingData)
    }

    console.log('✅ Movie rated:', ratingData)

    return NextResponse.json({ 
      success: true, 
      rating: ratingData,
      message: 'Rating saved successfully!'
    })

  } catch (error) {
    console.error('Movie rating error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to rate movie: ' + error.message 
    }, { status: 500 })
  }
}