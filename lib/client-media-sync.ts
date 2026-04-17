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

export type UserStatePayload = {
  onboarding: {
    completed: boolean
    responses: Record<string, any>
  }
  preferences?: {
    personalityType?: string | null
    genreWeights?: Record<string, number>
  }
  favoritePeople: any[]
  favoriteCategories: string[]
  dailyFact: {
    enabled: boolean
    today?: string
    fact?: any
    isNew?: boolean
    seenIds?: number[]
    lastDate?: string | null
    lastFactId?: number | null
  }
}

export type UserStatePatch = {
  onboarding?: Partial<UserStatePayload['onboarding']>
  favoritePeople?: any[]
  favoriteCategories?: string[]
  dailyFact?: Partial<UserStatePayload['dailyFact']>
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

    try {
      await saveWatchlistItem({
        movieId: item.movieId,
        title: item.title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
        overview: item.overview,
        media_type: item.media_type,
      })
      cloudIds.add(String(item.movieId))

      if (item.status === 'watched') {
        await updateWatchlistStatus(String(item.movieId), 'watched')
      }
    } catch (error: any) {
      // Keep merging even if one legacy/local item is malformed or already exists.
      if (error?.message?.toLowerCase?.().includes('already')) {
        cloudIds.add(String(item.movieId))
        continue
      }
      console.warn('[watchlist sync] skipping item', item?.movieId, error?.message || error)
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

    try {
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
      cloudIds.add(String(item.movieId))
    } catch (error) {
      console.warn('[ratings sync] skipping item', item?.movieId, error)
    }
  }

  cloud = await fetchCloudRatings()
  persistentStorage.setRatings(userEmail, cloud)
  return cloud
}

export async function fetchUserState(): Promise<UserStatePayload> {
  return readJson(await fetch('/api/user-state', { cache: 'no-store' }))
}

export async function patchUserState(payload: UserStatePatch) {
  return readJson(await fetch('/api/user-state', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
}

export async function syncLocalUserState(userEmail: string): Promise<UserStatePayload> {
  const cloud = await fetchUserState()
  const localFavoritePeople = persistentStorage.getFavoritePeople(userEmail)
  const localFavoriteCategories = persistentStorage.getFavoriteCategories(userEmail)
  const localOnboardingRaw = typeof window !== 'undefined' ? localStorage.getItem('onboardingAnswers') : null
  const localOnboardingCompleted = typeof window !== 'undefined' ? localStorage.getItem('onboardingCompleted') === 'true' : false

  const nextPayload: Partial<UserStatePayload> = {}

  if ((!cloud.favoritePeople || cloud.favoritePeople.length === 0) && localFavoritePeople.length > 0) {
    nextPayload.favoritePeople = localFavoritePeople
  }

  if ((!cloud.favoriteCategories || cloud.favoriteCategories.length === 0) && localFavoriteCategories.length > 0) {
    nextPayload.favoriteCategories = localFavoriteCategories
  }

  if ((!cloud.onboarding?.completed || Object.keys(cloud.onboarding.responses || {}).length === 0) && (localOnboardingCompleted || localOnboardingRaw)) {
    nextPayload.onboarding = {
      completed: localOnboardingCompleted,
      responses: localOnboardingRaw ? JSON.parse(localOnboardingRaw) : {},
    }
  }

  const merged = Object.keys(nextPayload).length > 0
    ? await patchUserState(nextPayload)
    : cloud

  persistentStorage.setFavoritePeople(userEmail, merged.favoritePeople || [])
  persistentStorage.setFavoriteCategories(userEmail, merged.favoriteCategories || [])
  if (typeof window !== 'undefined') {
    localStorage.setItem('onboardingAnswers', JSON.stringify(merged.onboarding?.responses || {}))
    localStorage.setItem('onboardingCompleted', merged.onboarding?.completed ? 'true' : 'false')
  }

  return merged
}
