'use client'

import { persistentStorage } from '@/lib/persistent-storage'

type WatchlistPayload = {
  movieId: string | number
  title: string
  poster_path?: string | null
  vote_average?: number | null
  release_date?: string | null
  overview?: string | null
  media_type?: string | null
}

type RatingPayload = WatchlistPayload & {
  rating: number
  review?: string | null
}

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export async function fetchCloudWatchlist() {
  const data = await readJson(await fetch('/api/watchlist', { cache: 'no-store' }))
  return data.watchlist || []
}

export async function saveWatchlistItem(payload: WatchlistPayload) {
  const data = await readJson(await fetch('/api/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  return data.watchlistItem
}

export async function updateWatchlistStatus(movieId: string, status: 'to_watch' | 'watched') {
  const data = await readJson(await fetch('/api/watchlist', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movieId, status }),
  }))
  return data.watchlistItem
}

export async function deleteWatchlistItem(movieId: string) {
  await readJson(await fetch(`/api/watchlist?movieId=${encodeURIComponent(movieId)}`, {
    method: 'DELETE',
  }))
}

export async function syncLocalWatchlist(userEmail: string) {
  const local = persistentStorage.getWatchlist(userEmail)
  let cloud = await fetchCloudWatchlist()
  const cloudIds = new Set(cloud.map((item: any) => String(item.movieId)))

  for (const item of local) {
    if (cloudIds.has(String(item.movieId))) {
      continue
    }

    await saveWatchlistItem({
      movieId: item.movieId,
      title: item.title,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      overview: item.overview,
      media_type: item.media_type,
    })

    if (item.status === 'watched') {
      await updateWatchlistStatus(String(item.movieId), 'watched')
    }
  }

  cloud = await fetchCloudWatchlist()
  persistentStorage.setWatchlist(userEmail, cloud)
  return cloud
}

export async function fetchCloudRatings() {
  const data = await readJson(await fetch('/api/movies/rate', { cache: 'no-store' }))
  return data.ratings || []
}

export async function saveRating(payload: RatingPayload) {
  const data = await readJson(await fetch('/api/movies/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  return data.rating
}

export async function syncLocalRatings(userEmail: string) {
  const local = persistentStorage.getRatings(userEmail)
  let cloud = await fetchCloudRatings()
  const cloudIds = new Set(cloud.map((item: any) => String(item.movieId)))

  for (const item of local) {
    if (cloudIds.has(String(item.movieId))) {
      continue
    }

    await saveRating({
      movieId: item.movieId,
      title: item.title,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      media_type: item.media_type,
      rating: item.rating,
      review: item.review,
    })
  }

  cloud = await fetchCloudRatings()
  persistentStorage.setRatings(userEmail, cloud)
  return cloud
}
