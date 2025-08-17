// app/api/movies/search/route.ts - FIXED FOR VERCEL DEPLOYMENT

import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY!

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Declare variables at top level to ensure they're in scope for error handling
  let query: string | null = null
  let type: string = 'multi'
  
  try {
    // FIXED: Use searchParams directly instead of new URL()
    const searchParams = request.nextUrl.searchParams
    query = searchParams.get('q')
    type = searchParams.get('type') || 'multi'
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    console.log(`🔍 API Search: "${query}" (type: ${type})`)

    let searchUrl = ''
    
    // FIXED: Person-specific search with proper URL
    if (type === 'person') {
      searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&include_adult=false`
      console.log('👤 Person search URL:', searchUrl)
    }
    // Multi-search (movies, people, TV shows)
    else if (type === 'multi') {
      searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    }
    // Movie-specific search
    else if (type === 'movie') {
      searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    }

    console.log('🌐 Making TMDB API call:', searchUrl)

    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 TMDB raw response:', {
      total_results: data.total_results,
      results_count: data.results?.length || 0,
      first_result: data.results?.[0] ? {
        name: data.results[0].name,
        media_type: data.results[0].media_type,
        known_for_department: data.results[0].known_for_department
      } : 'No results'
    })
    
    // FIXED: Much more lenient filtering for people
    let results = []
    
    if (type === 'person') {
      // For person search, be very lenient - just need a name
      results = (data.results || []).filter((person: any) => {
        return person.name && person.name.trim().length > 0
      }).map((person: any) => ({
        ...person,
        media_type: 'person', // Ensure this is set
        canAddToWatchlist: false, // People can't be added to watchlist
        displayType: `${person.known_for_department || 'Actor'} - Popularity: ${person.popularity?.toFixed(1) || 'N/A'}`
      }))
    } else {
      // For multi/movie search, use existing logic
      results = (data.results || []).filter((item: any) => {
        if (item.media_type === 'movie' || (!item.media_type && item.title)) {
          return item.poster_path && item.vote_average > 0
        }
        if (item.media_type === 'person') {
          return item.name && item.name.trim().length > 0 // Very lenient for people
        }
        if (item.media_type === 'tv') {
          return item.poster_path && item.vote_average > 0
        }
        return false
      }).map((item: any) => ({
        ...item,
        canAddToWatchlist: item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && item.poster_path),
        displayType: item.media_type === 'person' ? 
          `${item.known_for_department || 'Actor'} - Known for: ${item.known_for?.slice(0, 2).map((k: any) => k.title || k.name).join(', ') || 'Various works'}` :
          item.media_type === 'movie' ? 'Movie' : 
          item.media_type === 'tv' ? 'TV Show' : 'Movie'
      }))
    }

    // Limit results
    results = results.slice(0, 20)

    console.log(`✅ Filtered results: ${results.length} items`, {
      people: results.filter(r => r.media_type === 'person').length,
      movies: results.filter(r => r.media_type === 'movie').length,
      tv: results.filter(r => r.media_type === 'tv').length
    })

    return NextResponse.json({
      success: true,
      query,
      type,
      results: results,
      total_results: data.total_results || 0,
      debug: {
        api_results_count: data.results?.length || 0,
        filtered_results_count: results.length,
        search_url: searchUrl
      }
    })

  } catch (error) {
    console.error('❌ Search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search: ' + error.message,
      query: query || 'unknown',
      type: type || 'unknown'
    }, { status: 500 })
  }
}