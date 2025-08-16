// app/api/movies/search/route.ts - WORKING SEARCH API
import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = 'da4d264a4290972d086e0d21dce7cfeb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'multi' // multi, movie, person
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    console.log(`🔍 Searching for: "${query}" (type: ${type})`)

    let searchUrl = ''
    
    // Multi-search (movies, people, TV shows)
    if (type === 'multi') {
      searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
    }
    // Movie-specific search
    else if (type === 'movie') {
      searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
    }
    // Person search (actors, directors)
    else if (type === 'person') {
      searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
    }

    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter and format results
    const results = data.results?.filter((item: any) => {
      // Filter out items without images for better UX
      if (item.media_type === 'movie' || !item.media_type) {
        return item.poster_path && item.vote_average > 0
      }
      if (item.media_type === 'person') {
        return item.profile_path && item.known_for?.length > 0
      }
      return true
    }).slice(0, 20) || [] // Limit to 20 results

    console.log(`✅ Found ${results.length} results for "${query}"`)

    return NextResponse.json({
      success: true,
      query,
      results,
      total_results: data.total_results || 0
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search: ' + error.message
    }, { status: 500 })
  }
}