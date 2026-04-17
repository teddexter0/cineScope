import type { Movie, Rating, Watchlist, WatchlistItem } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type MediaPayload = {
  movieId: string | number
  title?: string
  poster_path?: string | null
  vote_average?: number | null
  release_date?: string | null
  overview?: string | null
  media_type?: string | null
}

type WatchlistWithMovie = WatchlistItem & {
  movie: Movie
}

type RatingWithMovie = Rating & {
  movie: Movie
}

function parseDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeMediaType(value?: string | null) {
  return value === 'tv' ? 'tv' : 'movie'
}

export function mapMovieMediaType(movie: Movie) {
  return movie.status === 'tv' ? 'tv' : 'movie'
}

export async function upsertMediaRecord(payload: MediaPayload) {
  const tmdbId = Number(payload.movieId)

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    throw new Error('Valid movieId is required')
  }

  const title = String(payload.title || '').trim()
  if (!title) {
    throw new Error('title is required')
  }

  return prisma.movie.upsert({
    where: { tmdbId },
    update: {
      title,
      overview: payload.overview ?? undefined,
      posterPath: payload.poster_path ?? undefined,
      voteAverage: typeof payload.vote_average === 'number' ? payload.vote_average : undefined,
      releaseDate: payload.release_date === undefined ? undefined : parseDate(payload.release_date),
      status: normalizeMediaType(payload.media_type),
    },
    create: {
      tmdbId,
      title,
      overview: payload.overview ?? null,
      posterPath: payload.poster_path ?? null,
      voteAverage: typeof payload.vote_average === 'number' ? payload.vote_average : 0,
      releaseDate: parseDate(payload.release_date),
      status: normalizeMediaType(payload.media_type),
    },
  })
}

export async function getOrCreateDefaultWatchlist(userId: string): Promise<Watchlist> {
  const existing = await prisma.watchlist.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  })

  if (existing) {
    return existing
  }

  return prisma.watchlist.create({
    data: {
      userId,
      name: 'My Watchlist',
      isDefault: true,
    },
  })
}

export function mapWatchlistItem(item: WatchlistWithMovie) {
  return {
    id: item.id,
    movieId: String(item.movie.tmdbId),
    title: item.movie.title,
    poster_path: item.movie.posterPath,
    vote_average: item.movie.voteAverage,
    release_date: item.movie.releaseDate?.toISOString() ?? null,
    overview: item.movie.overview,
    media_type: mapMovieMediaType(item.movie),
    status: item.status,
    addedAt: item.addedAt.toISOString(),
    watchedAt: item.watchedAt?.toISOString() ?? null,
  }
}

export function mapRatingItem(item: RatingWithMovie) {
  return {
    id: item.id,
    movieId: String(item.movie.tmdbId),
    title: item.movie.title,
    poster_path: item.movie.posterPath,
    vote_average: item.movie.voteAverage,
    release_date: item.movie.releaseDate?.toISOString() ?? null,
    media_type: mapMovieMediaType(item.movie),
    rating: item.rating,
    review: item.review,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}
