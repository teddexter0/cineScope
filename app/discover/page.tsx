'use client'
// app/discover/page.tsx — Letterboxd-style discovery: genre + decade + type + sort

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeft, Film, Tv, Star, Plus, Sparkles, ChevronLeft, ChevronRight, Search, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { persistentStorage } from '@/lib/persistent-storage'

// Static genre lists (TMDB IDs — stable)
const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
]
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 9648, name: 'Mystery' }, { id: 10764, name: 'Reality' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
]
const DECADES = ['1920s','1930s','1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s']
const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
]

type MediaType = 'movie' | 'tv'
type Section = 'discover' | 'upcoming' | 'now_airing'

export default function DiscoverPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<string>('')
  const [sort, setSort] = useState('popularity.desc')
  const [section, setSection] = useState<Section>('discover')
  const [results, setResults] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ type: true, genre: false, era: false, sort: false })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const searchMovies = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setSearchMode(false); return }
    setIsSearching(true)
    setSearchMode(true)
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}&type=${section === 'now_airing' ? 'tv' : 'multi'}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch { setSearchResults([]) }
    finally { setIsSearching(false) }
  }, [section])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (!q.trim()) { setSearchMode(false); setSearchResults([]); return }
    const t = setTimeout(() => searchMovies(q), 350)
    return () => clearTimeout(t)
  }

  const fetchResults = useCallback(async (p = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (section === 'upcoming')    { params.set('section', 'upcoming') }
      else if (section === 'now_airing') { params.set('section', 'now_airing') }
      else {
        params.set('type', mediaType)
        params.set('sort', sort)
        if (selectedGenre) params.set('genre', String(selectedGenre))
        if (selectedDecade) params.set('decade', selectedDecade)
      }
      const res = await fetch(`/api/discover?${params}`)
      const data = await res.json()
      setResults(data.results || [])
      setTotalPages(Math.min(data.total_pages || 1, 20))
      setPage(data.page || 1)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [mediaType, selectedGenre, selectedDecade, sort, section])

  useEffect(() => { fetchResults(1) }, [fetchResults])

  const handleAddToWatchlist = (movie: any) => {
    const userEmail = session?.user?.email || 'demo@user.com'
    const ok = persistentStorage.addToWatchlist(userEmail, { ...movie, media_type: mediaType })
    showToast(ok ? `"${movie.title || movie.name}" added to watchlist!` : 'Already in watchlist', ok ? 'success' : 'info')
  }

  const showToast = (msg: string, type: 'success' | 'info') => {
    const el = document.createElement('div')
    el.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${type === 'success' ? 'bg-green-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2500)
  }

  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES
  const posterUrl = (path: string | null) => path ? `https://image.tmdb.org/t/p/w342${path}` : ''

  if (status === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white/90 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" /> Discover
          </h1>
          <p className="text-purple-200 mt-1">Browse by genre, era, and type — just like a film library</p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'discover',   label: '🔍 Browse' },
            { key: 'upcoming',   label: '🎬 Upcoming' },
            { key: 'now_airing', label: '📺 Now Airing' },
          ].map(s => (
            <button key={s.key} onClick={() => { setSection(s.key as Section); setPage(1); setSearchQuery(''); setSearchMode(false) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${section === s.key ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Search bar — always visible */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={`Search ${section === 'now_airing' ? 'TV shows' : 'movies & shows'}…`}
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          )}
          {searchQuery && !isSearching && (
            <button onClick={() => { setSearchQuery(''); setSearchMode(false); setSearchResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-lg leading-none">×</button>
          )}
        </div>

        {/* Accordion Filters (only for Browse section, hidden during search) */}
        {section === 'discover' && !searchMode && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
              <SlidersHorizontal className="w-4 h-4 text-purple-300" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Filters</span>
              {(selectedGenre || selectedDecade || sort !== 'popularity.desc' || mediaType !== 'movie') && (
                <button onClick={() => { setSelectedGenre(null); setSelectedDecade(''); setSort('popularity.desc'); setMediaType('movie') }}
                  className="ml-auto text-xs text-purple-300 hover:text-white">Reset</button>
              )}
            </div>

            {/* Type */}
            <div className="border-b border-white/10">
              <button onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  {mediaType === 'movie' ? <Film className="w-4 h-4 text-blue-400" /> : <Tv className="w-4 h-4 text-pink-400" />}
                  Type
                  <span className="text-white/40 font-normal">{mediaType === 'movie' ? 'Movies' : 'Series'}</span>
                </span>
                {openSections.type ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {openSections.type && (
                <div className="px-4 pb-3 flex gap-2">
                  {(['movie', 'tv'] as MediaType[]).map(t => (
                    <button key={t} onClick={() => { setMediaType(t); setSelectedGenre(null) }}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mediaType === t ? (t === 'movie' ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white') : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
                      {t === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                      {t === 'movie' ? 'Movies' : 'Series'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Genre */}
            <div className="border-b border-white/10">
              <button onClick={() => toggleSection('genre')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  Genre
                  {selectedGenre && <span className="text-yellow-400 font-normal text-xs">{genres.find(g => g.id === selectedGenre)?.name}</span>}
                </span>
                {openSections.genre ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {openSections.genre && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  <button onClick={() => setSelectedGenre(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!selectedGenre ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    All
                  </button>
                  {genres.map(g => (
                    <button key={g.id} onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedGenre === g.id ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Era — works for both Movies and Series */}
            <div className="border-b border-white/10">
              <button onClick={() => toggleSection('era')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  Era
                  {selectedDecade && <span className="text-purple-400 font-normal text-xs">{selectedDecade}</span>}
                </span>
                {openSections.era ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {openSections.era && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  <button onClick={() => setSelectedDecade('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!selectedDecade ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                    All time
                  </button>
                  {DECADES.map(d => (
                    <button key={d} onClick={() => setSelectedDecade(selectedDecade === d ? '' : d)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedDecade === d ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div>
              <button onClick={() => toggleSection('sort')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  Sort by
                  <span className="text-green-400 font-normal text-xs">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
                </span>
                {openSections.sort ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {openSections.sort && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSort(o.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${sort === o.value ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {(isLoading || isSearching) ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (searchMode ? searchResults : results).length === 0 ? (
          <div className="text-center py-20 text-white/60">
            {searchMode ? `No results for "${searchQuery}". Try a different title.` : 'No results found. Try adjusting your filters.'}
          </div>
        ) : (
          <>
            {searchMode && (
              <p className="text-white/50 text-sm mb-3">{searchResults.length} results for "<span className="text-white">{searchQuery}</span>"</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {(searchMode ? searchResults : results).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="group">
                  <div className="bg-white/10 rounded-lg overflow-hidden border border-white/20 hover:border-yellow-400/50 transition-all">
                    <div className="aspect-[2/3] relative">
                      {item.poster_path ? (
                        <Image src={posterUrl(item.poster_path)} alt={item.title || item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="16vw" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">
                          {section === 'now_airing' || mediaType === 'tv' ? '📺' : '🎬'}
                        </div>
                      )}
                      <button
                        onClick={() => handleAddToWatchlist(item)}
                        className="absolute bottom-2 right-2 bg-purple-600/90 hover:bg-purple-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        title="Add to watchlist"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {item.vote_average > 0 && (
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white text-xs">{item.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-white text-xs font-medium line-clamp-2">{item.title || item.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {new Date(item.release_date || item.first_air_date || '').getFullYear() || '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination — hidden during search */}
            {!searchMode && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchResults(page - 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-all text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-white/60 text-sm">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchResults(page + 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-all text-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
