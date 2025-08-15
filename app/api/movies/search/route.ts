
// Create this file: app/api/movies/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MovieService } from '@/lib/movie-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const movies = await MovieService.searchMovies(query)
    
    return NextResponse.json({ 
      success: true, 
      movies: movies 
    })
  } catch (error) {
    console.error('Error searching movies:', error)
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}