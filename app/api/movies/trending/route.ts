// Create this file: app/api/movies/trending/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MovieService } from '@/lib/movie-service'

export async function GET(request: NextRequest) {
  try {
    const movies = await MovieService.getTrendingMovies()
    
    return NextResponse.json({ 
      success: true, 
      movies: movies 
    })
  } catch (error) {
    console.error('Error fetching trending movies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}
