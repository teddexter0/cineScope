// app/api/discover/route.ts
// Letterboxd-style discovery: genre + decade + type + sort filters via TMDB

import { NextRequest, NextResponse } from 'next/server'

const TMDB_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || ''
const BASE = 'https://api.themoviedb.org/3'

const DECADE_RANGES: Record<string, { gte: string; lte: string }> = {
  '1920s': { gte: '1920-01-01', lte: '1929-12-31' },
  '1930s': { gte: '1930-01-01', lte: '1939-12-31' },
  '1940s': { gte: '1940-01-01', lte: '1949-12-31' },
  '1950s': { gte: '1950-01-01', lte: '1959-12-31' },
  '1960s': { gte: '1960-01-01', lte: '1969-12-31' },
  '1970s': { gte: '1970-01-01', lte: '1979-12-31' },
  '1980s': { gte: '1980-01-01', lte: '1989-12-31' },
  '1990s': { gte: '1990-01-01', lte: '1999-12-31' },
  '2000s': { gte: '2000-01-01', lte: '2009-12-31' },
  '2010s': { gte: '2010-01-01', lte: '2019-12-31' },
  '2020s': { gte: '2020-01-01', lte: '2029-12-31' },
}

async function tmdbGet(path: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}api_key=${TMDB_KEY}`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type      = searchParams.get('type') || 'movie'    // movie | tv
  const genre     = searchParams.get('genre') || ''         // TMDB genre id
  const decade    = searchParams.get('decade') || ''        // e.g. "2020s"
  const sort      = searchParams.get('sort') || 'popularity.desc'
  const page      = searchParams.get('page') || '1'
  const section   = searchParams.get('section') || ''       // 'upcoming' | 'now_airing'

  try {
    // ── Upcoming movies / now airing TV (no other filters apply) ─────────
    if (section === 'upcoming') {
      const data = await tmdbGet(`/movie/upcoming?page=${page}`)
      return NextResponse.json({ success: true, results: data.results, total_pages: data.total_pages, page: data.page })
    }
    if (section === 'now_airing') {
      const data = await tmdbGet(`/tv/on_the_air?page=${page}`)
      return NextResponse.json({ success: true, results: data.results, total_pages: data.total_pages, page: data.page })
    }

    // ── Genre list ─────────────────────────────────────────────────────────
    if (section === 'genres') {
      const [movieGenres, tvGenres] = await Promise.all([
        tmdbGet('/genre/movie/list'),
        tmdbGet('/genre/tv/list'),
      ])
      return NextResponse.json({ success: true, movie: movieGenres.genres, tv: tvGenres.genres })
    }

    // ── Standard discover ─────────────────────────────────────────────────
    const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie'
    const dateGteKey = type === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte'
    const dateLteKey = type === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte'

    const params = new URLSearchParams({
      sort_by: sort,
      page,
      include_adult: 'false',
      'vote_count.gte': '50',
    })

    if (genre) params.set('with_genres', genre)

    if (decade && DECADE_RANGES[decade]) {
      params.set(dateGteKey, DECADE_RANGES[decade].gte)
      params.set(dateLteKey, DECADE_RANGES[decade].lte)
    }

    const data = await tmdbGet(`${endpoint}?${params.toString()}`)

    return NextResponse.json({
      success: true,
      results: data.results || [],
      total_pages: data.total_pages,
      page: data.page,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
