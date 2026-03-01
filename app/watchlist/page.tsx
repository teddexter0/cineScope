// app/watchlist/page.tsx - Watchlist & Watched with Movies/Series filtering

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Trash2, Play, ArrowLeft, Upload, CheckCircle, XCircle, Loader, Eye, EyeOff, Film, Tv } from 'lucide-react'
import { persistentStorage } from '@/lib/persistent-storage'

interface ImportResult {
  total: number
  imported: number
  skipped: number
  failed: string[]
}

type WatchTab = 'to_watch' | 'watched'
type MediaFilter = 'all' | 'movie' | 'tv'

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [watchTab, setWatchTab] = useState<WatchTab>('to_watch')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      loadWatchlist()
    }
  }, [status, router])

  const loadWatchlist = async () => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const storedWatchlist = persistentStorage.getWatchlist(userEmail)
      setWatchlist(storedWatchlist)

      // Optional: Try to sync with server
      try {
        const response = await fetch('/api/watchlist')
        const data = await response.json()
        if (data.success && data.watchlist?.length > 0) {
          const serverWatchlist = data.watchlist
          const mergedWatchlist = [...storedWatchlist]
          serverWatchlist.forEach((serverItem: any) => {
            const exists = mergedWatchlist.find((local: any) => local.movieId === serverItem.movieId)
            if (!exists) mergedWatchlist.push(serverItem)
          })
          if (mergedWatchlist.length > storedWatchlist.length) {
            persistentStorage.setWatchlist(userEmail, mergedWatchlist)
            setWatchlist(mergedWatchlist)
          }
        }
      } catch {
        // Server sync optional, ignore failure
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWatchlist = async (movieId: string) => {
    const userEmail = session?.user?.email || 'demo@user.com'
    persistentStorage.removeFromWatchlist(userEmail, movieId)
    setWatchlist(persistentStorage.getWatchlist(userEmail))
    try {
      await fetch(`/api/watchlist?movieId=${movieId}`, { method: 'DELETE' })
    } catch { /* background sync, not critical */ }
  }

  const toggleWatched = (movieId: string, currentStatus: string) => {
    const userEmail = session?.user?.email || 'demo@user.com'
    if (currentStatus === 'watched') {
      persistentStorage.markAsToWatch(userEmail, movieId)
    } else {
      persistentStorage.markAsWatched(userEmail, movieId)
    }
    setWatchlist(persistentStorage.getWatchlist(userEmail))
  }

  // Derived counts for tab labels
  const toWatchItems = useMemo(() =>
    watchlist.filter(m => (m.status || 'to_watch') === 'to_watch'), [watchlist])
  const watchedItems = useMemo(() =>
    watchlist.filter(m => m.status === 'watched'), [watchlist])

  // Apply both tab filter + media filter
  const displayedItems = useMemo(() => {
    const base = watchTab === 'to_watch' ? toWatchItems : watchedItems
    if (mediaFilter === 'all') return base
    return base.filter(m => (mediaFilter === 'tv' ? m.media_type === 'tv' : m.media_type !== 'tv'))
  }, [watchTab, mediaFilter, toWatchItems, watchedItems])

  const parseImdbCsv = (csvText: string): Array<{ title: string; year: string; imdbId: string }> => {
    const lines = csvText.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const titleIdx = header.findIndex(h => h === 'title')
    const yearIdx = header.findIndex(h => h === 'year')
    const constIdx = header.findIndex(h => h === 'const')
    return lines.slice(1).map(line => {
      const fields: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes }
        else if (char === ',' && !inQuotes) { fields.push(current); current = '' }
        else { current += char }
      }
      fields.push(current)
      return {
        title: titleIdx >= 0 ? fields[titleIdx]?.trim() ?? '' : '',
        year: yearIdx >= 0 ? fields[yearIdx]?.trim() ?? '' : '',
        imdbId: constIdx >= 0 ? fields[constIdx]?.trim() ?? '' : ''
      }
    }).filter(item => item.title)
  }

  const searchTmdbForTitle = async (title: string, year: string): Promise<any | null> => {
    try {
      const query = encodeURIComponent(title)
      const yearParam = year ? `&year=${year}` : ''
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${query}${yearParam}&include_adult=false`
      )
      const data = await res.json()
      const result = (data.results || []).find((r: any) => r.poster_path && r.vote_average > 0)
      return result || null
    } catch {
      return null
    }
  }

  const handleImdbImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const items = parseImdbCsv(text)
      const userEmail = session?.user?.email || 'demo@user.com'
      const result: ImportResult = { total: items.length, imported: 0, skipped: 0, failed: [] }
      for (const item of items) {
        if (!item.title) continue
        const tmdbMovie = await searchTmdbForTitle(item.title, item.year)
        if (!tmdbMovie) { result.failed.push(item.title); continue }
        const movieData = {
          id: tmdbMovie.id,
          title: tmdbMovie.title || tmdbMovie.name,
          poster_path: tmdbMovie.poster_path,
          vote_average: tmdbMovie.vote_average,
          release_date: tmdbMovie.release_date || tmdbMovie.first_air_date,
          overview: tmdbMovie.overview,
          media_type: tmdbMovie.media_type || 'movie'
        }
        const added = persistentStorage.addToWatchlist(userEmail, movieData)
        if (added) { result.imported++ } else { result.skipped++ }
        await new Promise(r => setTimeout(r, 250))
      }
      setWatchlist(persistentStorage.getWatchlist(userEmail))
      setImportResult(result)
    } catch (err) {
      console.error('IMDB import error:', err)
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (posterPath) return `https://image.tmdb.org/t/p/w500${posterPath}`
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="450" fill="#374151"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48">🎬</text>
      </svg>
    `)}`
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const moviesInTab = (tab: WatchTab) => {
    const base = tab === 'to_watch' ? toWatchItems : watchedItems
    return base.filter(m => m.media_type !== 'tv').length
  }
  const seriesInTab = (tab: WatchTab) => {
    const base = tab === 'to_watch' ? toWatchItems : watchedItems
    return base.filter(m => m.media_type === 'tv').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">📋 My Lists</h1>
              <p className="text-purple-200">
                {toWatchItems.length} to watch · {watchedItems.length} watched
              </p>
            </div>

            {/* IMDB Import */}
            <div className="flex-shrink-0">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm cursor-pointer transition-all duration-200 ${
                isImporting
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 hover:text-yellow-200'
              }`}>
                {isImporting ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import IMDB Watchlist</>
                )}
                <input type="file" accept=".csv" className="hidden" disabled={isImporting} onChange={handleImdbImport} />
              </label>
              <p className="text-white/30 text-xs mt-1 text-right">Export CSV from imdb.com/list/watchlist</p>
            </div>
          </div>

          {/* Import result banner */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white/10 border border-white/20 rounded-xl p-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  Import complete — {importResult.imported} added, {importResult.skipped} already in list
                  {importResult.failed.length > 0 && `, ${importResult.failed.length} not found on TMDB`}
                </p>
                {importResult.failed.length > 0 && (
                  <p className="text-white/50 text-xs mt-1 truncate">
                    Couldn't find: {importResult.failed.slice(0, 5).join(', ')}{importResult.failed.length > 5 ? `… +${importResult.failed.length - 5} more` : ''}
                  </p>
                )}
              </div>
              <button onClick={() => setImportResult(null)} className="text-white/40 hover:text-white/70 flex-shrink-0">
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Watch Status Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setWatchTab('to_watch')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              watchTab === 'to_watch'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-white/10 text-white/60 hover:bg-white/15'
            }`}
          >
            <Eye className="w-4 h-4" />
            Watchlist
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{toWatchItems.length}</span>
          </button>
          <button
            onClick={() => setWatchTab('watched')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              watchTab === 'watched'
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                : 'bg-white/10 text-white/60 hover:bg-white/15'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Watched
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{watchedItems.length}</span>
          </button>
        </div>

        {/* Media Type Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'movie', 'tv'] as MediaFilter[]).map(f => {
            const base = watchTab === 'to_watch' ? toWatchItems : watchedItems
            const count = f === 'all'
              ? base.length
              : f === 'tv'
                ? base.filter(m => m.media_type === 'tv').length
                : base.filter(m => m.media_type !== 'tv').length
            return (
              <button
                key={f}
                onClick={() => setMediaFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mediaFilter === f
                    ? 'bg-white/25 text-white border border-white/30'
                    : 'bg-white/10 text-white/50 border border-transparent hover:bg-white/15'
                }`}
              >
                {f === 'tv' ? <Tv className="w-3.5 h-3.5" /> : f === 'movie' ? <Film className="w-3.5 h-3.5" /> : null}
                {f === 'all' ? 'All' : f === 'tv' ? 'Series' : 'Movies'}
                <span className="opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Content Grid */}
        {watchlist.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Watchlist is Empty</h2>
            <p className="text-white/70 mb-6">Start adding movies and series from your recommendations!</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Browse Movies
            </button>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <div className="text-5xl mb-3">
              {watchTab === 'watched' ? '✅' : '📋'}
            </div>
            <p className="text-white/70">
              {watchTab === 'watched'
                ? `No ${mediaFilter === 'all' ? '' : mediaFilter === 'tv' ? 'series' : 'movies'} marked as watched yet.`
                : `No ${mediaFilter === 'all' ? '' : mediaFilter === 'tv' ? 'series' : 'movies'} in your watchlist.`}
            </p>
            {watchTab === 'watched' && (
              <button
                onClick={() => setWatchTab('to_watch')}
                className="mt-4 text-sm text-purple-300 hover:text-purple-200 underline"
              >
                Go to Watchlist →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayedItems.map((movie, index) => (
              <motion.div
                key={movie.movieId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className={`bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden border transition-all duration-300 ${
                  movie.status === 'watched'
                    ? 'border-green-400/30 hover:border-green-400/60'
                    : 'border-white/20 hover:border-purple-400/50'
                }`}>
                  {/* Poster */}
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <Image
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                      fill
                      className={`object-cover group-hover:scale-110 transition-transform duration-300 ${movie.status === 'watched' ? 'brightness-75' : ''}`}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                    />

                    {/* Watched overlay badge */}
                    {movie.status === 'watched' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-green-500/80 rounded-full p-2">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Media Type Badge */}
                    {movie.media_type && (
                      <div className="absolute top-2 left-2 bg-blue-500/80 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-white text-xs font-bold flex items-center gap-1">
                          {movie.media_type === 'tv'
                            ? <><Tv className="w-3 h-3" /> Series</>
                            : <><Film className="w-3 h-3" /> Movie</>}
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => toggleWatched(movie.movieId, movie.status || 'to_watch')}
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors w-full justify-center ${
                          movie.status === 'watched'
                            ? 'bg-yellow-500/90 hover:bg-yellow-600 text-white'
                            : 'bg-green-500/90 hover:bg-green-600 text-white'
                        }`}
                      >
                        {movie.status === 'watched'
                          ? <><EyeOff className="w-3 h-3" /> Unwatch</>
                          : <><CheckCircle className="w-3 h-3" /> Mark Watched</>}
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(movie.movieId)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white transition-colors w-full justify-center"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{movie.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-white/70 text-xs">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <span className="text-white/50 text-xs">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBD'}
                      </span>
                    </div>
                    {movie.status === 'watched' && movie.watchedAt && (
                      <div className="mt-1 text-green-400/80 text-xs">
                        Watched {new Date(movie.watchedAt).toLocaleDateString()}
                      </div>
                    )}
                    {movie.status !== 'watched' && (
                      <div className="mt-1 text-white/40 text-xs">
                        Added {new Date(movie.addedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {watchlist.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">📊 Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">{toWatchItems.length}</div>
                <div className="text-white/60 text-sm">To Watch</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{watchedItems.length}</div>
                <div className="text-white/60 text-sm">Watched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {watchlist.length > 0
                    ? (watchlist.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / watchlist.length).toFixed(1)
                    : '0.0'}
                </div>
                <div className="text-white/60 text-sm">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">
                  {watchlist.filter(m => m.media_type !== 'tv').length}
                </div>
                <div className="text-white/60 text-sm">Movies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-300">
                  {watchlist.filter(m => m.media_type === 'tv').length}
                </div>
                <div className="text-white/60 text-sm">Series</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
