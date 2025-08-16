// REPLACE your app/api/movies/rate/route.ts with this consolidated version:

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Simple in-memory storage for ratings (same as watchlist approach)
const sessionRatings = new Map<string, any[]>()

// GET - Retrieve all user ratings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const userRatings = sessionRatings.get(userEmail) || []
    
    console.log('⭐ Getting ratings for:', userEmail, 'Count:', userRatings.length)
    
    return NextResponse.json({ 
      success: true,
      ratings: userRatings
    })
  } catch (error) {
    console.error('❌ Get ratings error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get ratings' 
    }, { status: 500 })
  }
}

// POST - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const body = await request.json()
    const { movieId, title, poster_path, vote_average, release_date, rating, review } = body

    // Get existing ratings
    const userRatings = sessionRatings.get(userEmail) || []
    
    // Check if already rated
    const existingIndex = userRatings.findIndex(item => item.movieId === movieId?.toString())
    
    const ratingItem = {
      id: existingIndex >= 0 ? userRatings[existingIndex].id : Date.now().toString(),
      movieId: movieId?.toString(),
      title,
      poster_path,
      vote_average,
      release_date,
      rating,
      review: review || 'Liked from AI recommendations',
      createdAt: existingIndex >= 0 ? userRatings[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      // Update existing rating
      userRatings[existingIndex] = ratingItem
      console.log('📝 Updated rating for:', title)
    } else {
      // Add new rating
      userRatings.push(ratingItem)
      console.log('⭐ Added new rating for:', title)
    }
    
    sessionRatings.set(userEmail, userRatings)

    return NextResponse.json({ 
      success: true, 
      rating: ratingItem,
      message: `${title} rating saved!`
    })
  } catch (error) {
    console.error('❌ Add rating error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to save rating: ' + error.message 
    }, { status: 500 })
  }
}

// DELETE - Remove a rating
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userEmail = session?.user?.email || 'demo@user.com'
    
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'movieId required' }, { status: 400 })
    }

    const userRatings = sessionRatings.get(userEmail) || []
    const updatedRatings = userRatings.filter(item => item.movieId !== movieId)
    
    sessionRatings.set(userEmail, updatedRatings)

    console.log('🗑️ Removed rating for movieId:', movieId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Remove rating error:', error)
    return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 })
  }
}