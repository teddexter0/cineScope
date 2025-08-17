// app/api/movies/search/route.ts - IMPROVED SEARCH (Movies only for watchlist)
import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'multi'
    
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
    // Person search (actors, directors) - but no watchlist button
    else if (type === 'person') {
      searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
    }

    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter and format results - IMPROVED LOGIC
    const results = data.results?.filter((item: any) => {
      // Only show quality content with images
      if (item.media_type === 'movie' || !item.media_type) {
        return item.poster_path && item.vote_average > 0 && item.overview
      }
      if (item.media_type === 'person') {
        return item.profile_path && item.known_for?.length > 0
      }
      if (item.media_type === 'tv') {
        return false // Don't show TV shows for now
      }
      return true
    }).slice(0, 15) || [] // Limit to 15 results

    // Mark which items can be added to watchlist
    const enhancedResults = results.map((item: any) => ({
      ...item,
      canAddToWatchlist: item.media_type === 'movie' || (!item.media_type && item.poster_path),
      displayType: item.media_type === 'person' ? 
        `${item.known_for_department || 'Actor'} - Known for: ${item.known_for?.slice(0, 2).map((k: any) => k.title || k.name).join(', ')}` :
        item.media_type === 'movie' ? 'Movie' : 'Movie'
    }))

    console.log(`✅ Found ${enhancedResults.length} results for "${query}"`)

    return NextResponse.json({
      success: true,
      query,
      results: enhancedResults,
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