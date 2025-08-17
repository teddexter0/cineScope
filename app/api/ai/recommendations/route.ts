// app/api/ai/recommendations/route.ts - NEW SERVER-SIDE AI API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const TMDB_API_KEY = process.env.TMDB_API_KEY! // This works on server-side

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { userProfile } = body

    console.log('🤖 Server-side AI generating recommendations...')
    console.log('🔑 API Key available:', !!TMDB_API_KEY)

    const recommendations = await generateEnhancedRecommendations(userProfile)

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length
    })

  } catch (error) {
    console.error('❌ Server AI error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations'
    }, { status: 500 })
  }
}

// Server-side AI logic (moved from client)
async function generateEnhancedRecommendations(userProfile: any): Promise<any[]> {
  try {
    console.log('🎬 Generating ENHANCED AI recommendations with TV shows...')
    
    const allContent: any[] = []
    const currentTime = Date.now()
    const dynamicSeed = Math.floor(currentTime / (1000 * 60 * 3)) % 50 + 1

    // 1. MOVIES (40% of recommendations)
    console.log('🎬 Fetching movies...')
    const movieRecs = await generateMovieRecommendations(userProfile, dynamicSeed)
    allContent.push(...movieRecs)

    // 2. TV SHOWS (40% of recommendations)
    console.log('📺 Fetching TV shows...')
    const tvRecs = await generateTVRecommendations(userProfile, dynamicSeed)
    allContent.push(...tvRecs)

    // 3. TRENDING MIXED CONTENT (20%)
    console.log('🔥 Fetching trending content...')
    const trendingMixed = await fetchTrendingMixed(dynamicSeed)
    allContent.push(...trendingMixed)

    console.log('📊 Total content fetched:', allContent.length)

    // Remove duplicates and score
    const uniqueContent = removeDuplicates(allContent)
    const scoredContent = uniqueContent.map(item => ({
      ...item,
      aiScore: calculateEnhancedAIScore(item, userProfile),
      contentType: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
      displayTitle: item.title || item.name || 'Unknown',
      media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
    })).sort((a, b) => b.aiScore - a.aiScore)

    const finalRecommendations = scoredContent.slice(0, 12)
    
    console.log('🏆 Final recommendations:', finalRecommendations.length)
    return finalRecommendations
    
  } catch (error) {
    console.error('❌ Enhanced recommendation error:', error)
    return await getFallbackRecommendations()
  }
}

async function generateMovieRecommendations(userProfile: any, seed: number): Promise<any[]> {
  const topGenres = Object.entries(userProfile.preferredGenres || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([genreId]) => genreId)

  const movies: any[] = []
  
  for (const genreId of topGenres) {
    const page = (seed % 5) + 1
    const genreMovies = await fetchMoviesByGenre(genreId, page)
    movies.push(...genreMovies)
  }
  
  return movies
}

async function generateTVRecommendations(userProfile: any, seed: number): Promise<any[]> {
  const topGenres = Object.entries(userProfile.preferredGenres || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([genreId]) => genreId)

  const tvShows: any[] = []
  
  for (const genreId of topGenres) {
    const page = (seed % 4) + 1
    const shows = await fetchTVShowsByGenre(genreId, page)
    tvShows.push(...shows)
  }

  const trendingTV = await fetchTrendingTVShows(seed)
  const popularTV = await fetchPopularTVShows(seed)
  tvShows.push(...trendingTV, ...popularTV)
  
  return tvShows
}

async function fetchMoviesByGenre(genreId: string, page: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=${page}&vote_average.gte=6.0`
    )
    const data = await response.json()
    return (data.results?.slice(0, 4) || []).map((movie: any) => ({
      ...movie,
      media_type: 'movie',
      displayTitle: movie.title
    }))
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error)
    return []
  }
}

async function fetchTVShowsByGenre(genreId: string, page: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=50&page=${page}&vote_average.gte=6.0`
    )
    const data = await response.json()
    
    return (data.results || []).slice(0, 4).map((show: any) => ({
      ...show,
      media_type: 'tv',
      title: show.name,
      release_date: show.first_air_date,
      displayTitle: show.name
    }))
  } catch (error) {
    console.error(`Error fetching TV shows for genre ${genreId}:`, error)
    return []
  }
}

async function fetchTrendingTVShows(seed: number): Promise<any[]> {
  try {
    const timeWindow = seed % 2 === 0 ? 'day' : 'week'
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/tv/${timeWindow}?api_key=${TMDB_API_KEY}&page=${seed % 3 + 1}`
    )
    const data = await response.json()
    
    return (data.results || []).slice(0, 3).map((show: any) => ({
      ...show,
      media_type: 'tv',
      title: show.name,
      release_date: show.first_air_date,
      displayTitle: show.name
    }))
  } catch (error) {
    console.error('Error fetching trending TV shows:', error)
    return []
  }
}

async function fetchPopularTVShows(seed: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&page=${seed % 5 + 1}`
    )
    const data = await response.json()
    
    return (data.results || []).slice(0, 3).map((show: any) => ({
      ...show,
      media_type: 'tv',
      title: show.name,
      release_date: show.first_air_date,
      displayTitle: show.name
    }))
  } catch (error) {
    console.error('Error fetching popular TV shows:', error)
    return []
  }
}

async function fetchTrendingMixed(seed: number): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&page=${seed % 3 + 1}`
    )
    const data = await response.json()
    
    return (data.results || []).slice(0, 4).map((item: any) => ({
      ...item,
      title: item.title || item.name,
      release_date: item.release_date || item.first_air_date,
      displayTitle: item.title || item.name
    }))
  } catch (error) {
    console.error('Error fetching trending mixed content:', error)
    return []
  }
}

function calculateEnhancedAIScore(item: any, userProfile: any): number {
  let score = (item.vote_average || 0) * 10

  if (item.media_type === 'tv') {
    score += 8
  }

  if (item.genre_ids) {
    item.genre_ids.forEach((genreId: number) => {
      const weight = userProfile.preferredGenres?.[genreId.toString()]
      if (weight) {
        score += weight * 50
      }
    })
  }

  score += Math.random() * 20
  return Math.round(score)
}

function removeDuplicates(items: any[]): any[] {
  const seen = new Set()
  return items.filter(item => {
    if (!item.id || seen.has(item.id)) return false
    seen.add(item.id)
    return item.poster_path && item.vote_average > 0
  })
}

async function getFallbackRecommendations(): Promise<any[]> {
  try {
    console.log('🔄 Loading fallback recommendations...')
    const [movieResponse, tvResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1`),
      fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&page=1`)
    ])
    
    const [movieData, tvData] = await Promise.all([
      movieResponse.json(),
      tvResponse.json()
    ])
    
    const movies = (movieData.results || []).slice(0, 6).map((movie: any) => ({
      ...movie,
      media_type: 'movie',
      displayTitle: movie.title
    }))
    
    const tvShows = (tvData.results || []).slice(0, 6).map((show: any) => ({
      ...show,
      media_type: 'tv',
      title: show.name,
      release_date: show.first_air_date,
      displayTitle: show.name
    }))
    
    return [...movies, ...tvShows].filter(item => item.vote_average > 7.0 && item.poster_path)
  } catch (error) {
    console.error('Fallback recommendations failed:', error)
    return []
  }
}