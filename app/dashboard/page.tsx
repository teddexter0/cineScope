'use client'
// app/dashboard/page.tsx

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film, Search, Star, Plus, Clock, Sparkles, User,
  LogOut, Brain, Zap, AtSign, CheckCircle, AlertCircle,
  X, Heart, HelpCircle, Loader2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'
import DailyFactPopup from '@/app/components/DailyFactPopup'
import MovieCard from '@/app/components/MovieCard'
import OnboardingTour from '@/app/components/OnboardingTour'
import { persistentStorage } from '@/lib/persistent-storage'
import { patchUserState, saveRating, saveWatchlistItem, syncLocalRatings, syncLocalUserState, syncLocalWatchlist, type UserStatePayload } from '@/lib/client-media-sync'

const GENRES = [
  { id: '28', name: 'Action', emoji: '' },
  { id: '35', name: 'Comedy', emoji: '' },
  { id: '18', name: 'Drama', emoji: '' },
  { id: '27', name: 'Horror', emoji: '' },
  { id: '878', name: 'Sci-Fi', emoji: '' },
  { id: '10749', name: 'Romance', emoji: '❤️' },
  { id: '53', name: 'Thriller', emoji: '' },
  { id: '14', name: 'Fantasy', emoji: '' },
  { id: '80', name: 'Crime', emoji: '' },
  { id: '12', name: 'Adventure', emoji: '' },
  { id: '99', name: 'Documentary', emoji: '' },
  { id: '16', name: 'Animation', emoji: '' },
]

function analyzePersonality(responses: Record<number, any>) {
  const text = Object.values(responses).map((v: any) =>
    Array.isArray(v) ? v.join(' ') : String(v)
  ).join(' ').toLowerCase()

  const kwMap: Record<string, string[]> = {
    '18': ['drama', 'emotional', 'deep', 'character', 'relationship'],
    '35': ['comedy', 'funny', 'laugh', 'humor', 'fun'],
    '28': ['action', 'fight', 'exciting', 'thrilling', 'fast'],
    '53': ['thriller', 'suspense', 'tension', 'mystery'],
    '27': ['horror', 'scary', 'fear', 'dark', 'creepy'],
    '10749': ['romance', 'love', 'romantic', 'heart'],
    '878': ['sci-fi', 'science', 'future', 'space'],
    '14': ['fantasy', 'magic', 'wizard', 'enchanting'],
    '80': ['crime', 'detective', 'investigation', 'police'],
    '12': ['adventure', 'journey', 'exploration', 'quest'],
  }

  const weights: Record<string, number> = {}
  Object.entries(kwMap).forEach(([id, kws]) => {
    const matches = kws.filter(k => text.includes(k)).length
    if (matches > 0) weights[id] = Math.min(0.9, matches * 0.18)
  })

  const selected = (Array.isArray(responses[2]) ? responses[2].join(' ') : String(responses[2] || '')).toLowerCase()
  Object.entries(kwMap).forEach(([id, kws]) => {
    if (kws.some(k => selected.includes(k))) weights[id] = 0.9
  })

  const types = [
    'Intellectual Explorer',
    'Emotional Connector',
    'Entertainment Seeker',
    'Escapist Explorer',
    'Critical Analyst',
    'Nostalgic Dreamer',
  ]

  return {
    preferredGenres: weights,
    personalityType: types[Math.floor(Math.random() * types.length)],
  }
}

export default function Dashboard() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [movies, setMovies] = useState<any[]>([])
  const [pageReady, setPageReady] = useState(false)
  const [isLoadingRecs, setIsLoadingRecs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [recStats, setRecStats] = useState({ accuracy: 95, count: 0 })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [favGenres, setFavGenres] = useState<string[]>([])
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})
  const [onboardingResponses, setOnboardingResponses] = useState<Record<string, any>>({})
  const [dailyFactState, setDailyFactState] = useState<UserStatePayload['dailyFact'] | null>(null)
  const [dailyFactOpenNonce, setDailyFactOpenNonce] = useState(0)
  const [tourReady, setTourReady] = useState(false)
  const [tourKey, setTourKey] = useState(0)
  const [showTourComp, setShowTourComp] = useState(true)
  const [tourCompleted, setTourCompleted] = useState(false)
  const [navLoading, setNavLoading] = useState<string | null>(null)
  const [menuActionLoading, setMenuActionLoading] = useState<string | null>(null)

  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [unStatus, setUnStatus] = useState<any>(null)
  const [unQuota, setUnQuota] = useState<any>(null)
  const [savingUn, setSavingUn] = useState(false)
  const unDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status !== 'authenticated') return
    const email = session?.user?.email || ''

    void (async () => {
      try {
        const userState = await syncLocalUserState(email || 'demo@user.com')
        setOnboardingResponses(userState.onboarding?.responses || {})
        setFavGenres(userState.favoriteCategories || [])
        setDailyFactState(userState.dailyFact || null)

        if (!userState.onboarding?.completed) {
          router.push('/onboarding')
          return
        }

        const syncedRatings = await syncLocalRatings(email || 'demo@user.com')
        await syncLocalWatchlist(email || 'demo@user.com')
        const map: Record<string, number> = {}
        syncedRatings.forEach((r: any) => {
          if (r.movieId) map[String(r.movieId)] = r.rating
        })
        setUserRatings(map)
        setPageReady(true)
        loadRecs(userState.onboarding?.responses || {}, userState.favoriteCategories || [])
      } catch (error) {
        console.error('Failed to sync ratings:', error)
        router.push('/onboarding')
      }
    })()

    setTourReady(true)
    setTourCompleted(!!localStorage.getItem('cinescope_tour_done_v1'))

    fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email,
        name: session?.user?.name,
        username: (session?.user as any)?.username,
      }),
    }).catch(() => {})
  }, [status]) // eslint-disable-line

  const loadRecs = async (responses = onboardingResponses, boostGenres: string[] = favGenres) => {
    setIsLoadingRecs(true)
    try {
      if (!responses || Object.keys(responses).length === 0) {
        router.push('/onboarding')
        return
      }

      const profile = analyzePersonality(responses as Record<number, any>)
      if (boostGenres?.length) {
        boostGenres.forEach(id => {
          profile.preferredGenres[id] = 0.95
        })
      }
      setUserProfile(profile)

      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile: profile }),
      })
      const data = await res.json()
      if (data.success && data.recommendations.length > 0) {
        setMovies(data.recommendations)
        setRecStats({
          accuracy: Math.min(99, 88 + Object.keys(profile.preferredGenres).length * 2),
          count: data.recommendations.length,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingRecs(false)
    }
  }

  const navTo = (path: string) => {
    setNavLoading(path)
    setMenuActionLoading(path)
    setShowUserMenu(false)
    router.push(path)
    setTimeout(() => {
      setNavLoading(null)
      setMenuActionLoading(null)
    }, 3000)
  }

  const doSearch = async (q: string) => {
    if (q.length < 2) {
      setShowSearch(false)
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}&type=multi`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.results)
        setShowSearch(true)
      }
    } catch {
    } finally {
      setIsSearching(false)
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      void doSearch(searchQuery)
    }, 420)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const addToWatchlist = async (movie: any) => {
    const email = session?.user?.email || 'demo@user.com'
    try {
      await saveWatchlistItem({
        movieId: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        overview: movie.overview,
        media_type: movie.media_type,
      })
      persistentStorage.addToWatchlist(email, movie)
      toast(`Saved "${movie.title || movie.name}"`, 'ok')

      fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activity',
          userEmail: email,
          name: session?.user?.name,
          verb: 'added',
          title: movie.title || movie.name,
          mediaType: movie.media_type === 'tv' ? 'tv' : 'movie',
          posterPath: movie.poster_path,
        }),
      }).catch(() => {})
    } catch (error: any) {
      toast(error?.message?.includes('already') ? 'Already saved' : 'Failed to save watchlist item', 'info')
    }
  }

  const addPersonFav = async (person: any) => {
    const email = session?.user?.email || 'demo@user.com'
    const ok = persistentStorage.addFavoritePerson(email, person)
    if (ok) {
      await patchUserState({ favoritePeople: persistentStorage.getFavoritePeople(email) })
    }
    toast(ok ? `✓ ${person.name} added to favorites` : 'Already in favorites', ok ? 'ok' : 'info')
    if (ok) {
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const rateMovie = async (movie: any, rating: number, review: string) => {
    const email = session?.user?.email || 'demo@user.com'
    const item = {
      movieId: movie.id,
      title: movie.title || movie.name || movie.displayTitle || 'Unknown',
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date,
      rating,
      review,
      media_type: movie.media_type || 'movie',
    }
    try {
      await saveRating(item)
      persistentStorage.addRating(email, item)
      setUserRatings(prev => ({ ...prev, [String(movie.id)]: rating }))
      setRecStats(prev => ({ ...prev, accuracy: Math.min(99, prev.accuracy + 1) }))
      toast(`Rated "${item.title}" ${rating}/10`, 'ok')
    } catch {
      toast('Failed to save rating', 'info')
    }
  }

  const toggleGenre = async (id: string) => {
    const email = session?.user?.email || ''
    if (!email) return
    const added = persistentStorage.toggleFavoriteCategory(email, id)
    const updated = persistentStorage.getFavoriteCategories(email)
    await patchUserState({ favoriteCategories: updated })
    setFavGenres(updated)
    const genre = GENRES.find(x => x.id === id)
    toast(added ? `${genre?.emoji} ${genre?.name} pinned - refreshing…` : `${genre?.name} unpinned`, added ? 'ok' : 'info')
    if (added) loadRecs(onboardingResponses, updated)
  }

  const toggleDailyFact = async () => {
    if (!dailyFactState) return
    const nextEnabled = !dailyFactState.enabled
    await patchUserState({ dailyFact: { enabled: nextEnabled } })
    setDailyFactState(prev => prev ? { ...prev, enabled: nextEnabled, isNew: false } : prev)
    if (nextEnabled) {
      setDailyFactOpenNonce(prev => prev + 1)
    }
    setShowUserMenu(false)
    toast(nextEnabled ? 'Fact of the day enabled' : 'Fact of the day disabled', 'info')
  }

  const openDailyFact = () => {
    if (!dailyFactState?.enabled) return
    setDailyFactOpenNonce(prev => prev + 1)
    setShowUserMenu(false)
  }

  const replayTour = () => {
    localStorage.removeItem('cinescope_tour_done_v1')
    setTourCompleted(false)
    setShowTourComp(false)
    setShowUserMenu(false)
    setTimeout(() => {
      setShowTourComp(true)
      setTourKey(k => k + 1)
    }, 50)
  }

  const toast = (msg: string, type: 'ok' | 'info') => {
    const el = document.createElement('div')
    el.style.cssText = `position:fixed;top:16px;right:16px;z-index:9999;padding:10px 16px;border-radius:10px;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;color:#fff;pointer-events:none;transition:opacity 0.3s;${
      type === 'ok'
        ? 'background:linear-gradient(135deg,#22c55e,#16a34a);'
        : 'background:rgba(255,255,255,0.12);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);'
    }`
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(() => {
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 320)
    }, 2600)
  }

  const openUnModal = async () => {
    setMenuActionLoading('change-username')
    setShowUserMenu(false)
    setNewUsername((session?.user as any)?.username || '')
    setUnStatus(null)
    setShowUsernameModal(true)
    try {
      const res = await fetch('/api/auth/change-username')
      if (res.ok) setUnQuota((await res.json()).quota)
    } finally {
      setMenuActionLoading(null)
    }
  }

  const checkUn = async (val: string) => {
    if (!val || val.length < 3) return
    setUnStatus({ checking: true })
    const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`)
    const data = await res.json()
    setUnStatus({ available: data.available, message: data.available ? 'Available!' : 'Taken' })
  }

  const handleUnInput = (val: string) => {
    setNewUsername(val)
    setUnStatus(null)
    if (unDebounce.current) clearTimeout(unDebounce.current)
    unDebounce.current = setTimeout(() => checkUn(val), 400)
  }

  const saveUn = async () => {
    if (!newUsername || savingUn) return
    setSavingUn(true)
    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      })
      const data = await res.json()
      if (data.success) {
        setUnQuota(data.quota)
        toast(`Username -> @${data.username}`, 'ok')
        setShowUsernameModal(false)
        await updateSession({ username: data.username })
      } else {
        setUnStatus({ error: data.error })
      }
    } finally {
      setSavingUn(false)
    }
  }

  if (status === 'loading' || !pageReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const menuItems = [
    { label: 'Watchlist', icon: Clock, path: '/watchlist' },
    { label: 'My Ratings', icon: Star, path: '/ratings' },
    { label: 'Fav. People', icon: User, path: '/people' },
    { label: 'Discover', icon: Sparkles, path: '/discover' },
    { label: 'Social', icon: User, path: '/social' },
    { label: 'Retrain AI', icon: Brain, path: '/onboarding' },
  ]

  return (
    <>
      <div className="youtube-background">
        <YouTubeTrailerBackground autoplay muted showControls={false} loop isDashboard className="w-full h-full" />
      </div>

      {dailyFactState?.fact && (
        <DailyFactPopup
          factData={{ fact: dailyFactState.fact, isNew: !!dailyFactState.isNew }}
          enabled={tourCompleted && dailyFactState.enabled}
          openNonce={dailyFactOpenNonce}
        />
      )}

      {showTourComp && (
        <OnboardingTour
          key={tourKey}
          onReady={() => setTourReady(true)}
          onFinish={() => setTourCompleted(true)}
        />
      )}

      {tourReady && (
        <button
          onClick={replayTour}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg transition-all hover:scale-105"
          style={{ background: 'rgba(10,8,22,0.92)', border: '1px solid rgba(250,204,21,0.3)', backdropFilter: 'blur(12px)' }}
        >
          <HelpCircle className="w-4 h-4 text-yellow-400" />
          <span>Tour</span>
        </button>
      )}

      <AnimatePresence>
        {showUsernameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
            onClick={e => {
              if (e.target === e.currentTarget) setShowUsernameModal(false)
            }}
          >
            <motion.div
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
              style={{ background: 'rgba(10,8,22,0.99)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
                  <AtSign className="w-4 h-4 text-purple-400" />
                  Change Username
                </h2>
                <button onClick={() => setShowUsernameModal(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {unQuota && (
                <div
                  className="mb-4 px-3 py-2 rounded-lg text-xs text-white/45 flex gap-3"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <span>{unQuota.used}/{unQuota.max} changes</span>
                  <span className="w-px h-3 bg-white/15 self-center" />
                  {unQuota.daysLeft > 0 ? (
                    <span className="text-yellow-400">{unQuota.daysLeft}d cooldown</span>
                  ) : (
                    <span className="text-green-400">Ready</span>
                  )}
                </div>
              )}

              <div className="relative mb-1">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => handleUnInput(e.target.value)}
                  placeholder="new_username"
                  maxLength={20}
                  className="w-full rounded-lg pl-9 pr-9 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}
                />
                {unStatus?.checking && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />}
                {unStatus?.available === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400" />}
                {unStatus?.available === false && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" />}
              </div>
              {unStatus?.message && <p className={`text-xs mt-1 mb-3 ${unStatus.available ? 'text-green-400' : 'text-red-400'}`}>{unStatus.message}</p>}
              {unStatus?.error && <p className="text-xs mt-1 mb-3 text-red-400">{unStatus.error}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-white/50 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveUn}
                  disabled={savingUn || !newUsername || newUsername.length < 3 || unStatus?.available === false || !unQuota?.canChange}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
                  style={{ background: '#7c3aed' }}
                >
                  {savingUn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen">
        <header
          className="sticky top-0 z-30 px-4 py-3 md:px-6"
          style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#facc15,#f97316)' }}
              >
                <Film className="w-4 h-4 text-amber-900" />
              </div>
              <span className="text-white font-bold text-base hidden sm:block" style={{ letterSpacing: '-0.03em' }}>
                CineScope
              </span>
              {userProfile && (
                <span
                  className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg text-purple-300"
                  style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.18)' }}
                >
                  <Brain className="w-3 h-3" />
                  {userProfile.personalityType}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={replayTour}
                title="Replay the tour"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-white/55 hover:text-white text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs">Tour</span>
              </button>

              <button
                onClick={() => loadRecs(onboardingResponses, favGenres)}
                disabled={isLoadingRecs}
                data-tour="refresh-ai"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-purple-200 text-sm transition-all disabled:opacity-50"
                style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.18)' }}
              >
                {isLoadingRecs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span className="hidden md:inline text-xs">
                  {isLoadingRecs ? 'Thinking…' : 'Refresh AI'}
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  data-tour="user-menu"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-white text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)' }}
                >
                  <User className="w-4 h-4 text-yellow-300" />
                  <span className="hidden md:inline text-xs font-medium">
                    {session?.user?.name || 'User'}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl py-1.5 shadow-2xl z-50"
                      style={{ background: 'rgba(10,8,22,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {menuItems.map(item => (
                        <button
                          key={item.path}
                          onClick={() => navTo(item.path)}
                          disabled={menuActionLoading !== null}
                          className="w-full text-left px-4 py-2.5 text-white/75 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-between text-sm disabled:opacity-60"
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="w-3.5 h-3.5 text-white/35 flex-shrink-0" />
                            {item.label}
                          </div>
                          {menuActionLoading === item.path && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                          )}
                        </button>
                      ))}

                      <div className="my-1 border-t border-white/8" />
                      <button
                        onClick={openUnModal}
                        disabled={menuActionLoading !== null}
                        className="w-full text-left px-4 py-2.5 text-white/75 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-between gap-2.5 text-sm disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2.5">
                          <AtSign className="w-3.5 h-3.5 text-purple-400" />
                          Change Username
                        </div>
                        {menuActionLoading === 'change-username' && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                        )}
                      </button>

                      <div className="my-1 border-t border-white/8" />
                      <button
                        onClick={toggleDailyFact}
                        disabled={menuActionLoading !== null || !dailyFactState}
                        className="w-full text-left px-4 py-2.5 text-white/75 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-between gap-2.5 text-sm disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          Fact of the Day
                        </div>
                        <span className={`text-xs ${dailyFactState?.enabled ? 'text-green-400' : 'text-white/35'}`}>
                          {dailyFactState?.enabled ? 'On' : 'Off'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-white/8" />
                      <button
                        onClick={openDailyFact}
                        disabled={menuActionLoading !== null || !dailyFactState?.enabled}
                        className="w-full text-left px-4 py-2.5 text-white/75 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-between gap-2.5 text-sm disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2.5">
                          <Film className="w-3.5 h-3.5 text-yellow-300" />
                          Today&apos;s Fact
                        </div>
                        <span className="text-xs text-white/35">Open</span>
                      </button>

                      <div className="my-1 border-t border-white/8" />
                      <button
                        onClick={async () => {
                          setMenuActionLoading('signout')
                          await signOut({ redirect: false })
                          router.push('/')
                        }}
                        disabled={menuActionLoading !== null}
                        className="w-full text-left px-4 py-2.5 text-white/75 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-between gap-2.5 text-sm disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2.5">
                          <LogOut className="w-3.5 h-3.5 text-white/35" />
                          Sign Out
                        </div>
                        {menuActionLoading === 'signout' && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <section className="px-4 pt-10 pb-6 md:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2.5" style={{ letterSpacing: '-0.035em' }}>
                Welcome back{' '}
                <span style={{ background: 'linear-gradient(135deg,#facc15,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {session?.user?.name?.split(' ')[0] || 'Movie Lover'}
                </span>
              </h1>
              <p className="text-white/45 text-sm md:text-base max-w-lg mx-auto">
                {isLoadingRecs ? 'AI is curating your picks…' : 'Hover any poster to see the synopsis, then rate or save it.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto relative"
              data-tour="search-bar"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                  }}
                  placeholder="Search movies, series, actors…"
                  className="w-full rounded-xl pl-11 pr-10 py-3.5 text-white placeholder-white/28 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/45 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)', backdropFilter: 'blur(12px)' }}
                />
                {isSearching ? (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400 animate-spin" />
                ) : searchQuery ? (
                  <button onClick={() => { setSearchQuery(''); setShowSearch(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-50 max-h-72 overflow-y-auto"
                    style={{ background: 'rgba(10,8,22,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {searchResults.map(r => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/7 transition-colors cursor-pointer"
                        onClick={() => {
                          if (r.media_type !== 'person') {
                            setMovies(current => [r, ...current.slice(0, 11)])
                            setShowSearch(false)
                            setSearchQuery('')
                          }
                        }}
                      >
                        <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-white/8">
                          {(r.poster_path || r.profile_path) ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${r.poster_path || r.profile_path}`}
                              alt={r.title || r.name}
                              width={32}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{r.title || r.name}</p>
                          <p className="text-white/38 text-xs">
                            {r.media_type === 'person' ? r.known_for_department || 'Actor' : r.media_type === 'tv' ? 'TV' : 'Film'}
                            {r.release_date && ` · ${new Date(r.release_date).getFullYear()}`}
                          </p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            r.media_type === 'person' ? addPersonFav(r) : addToWatchlist(r)
                          }}
                          className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <section className="px-4 pb-5 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
              <span className="text-white/38 text-xs font-medium uppercase tracking-wider">Pinned genres</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                ...GENRES.filter(g => favGenres.includes(g.id)),
                ...GENRES.filter(g => !favGenres.includes(g.id)),
              ].map(g => {
                const on = favGenres.includes(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: on ? 'rgba(250,204,21,0.11)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${on ? 'rgba(250,204,21,0.32)' : 'rgba(255,255,255,0.09)'}`,
                      color: on ? '#facc15' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{g.emoji}</span>
                    <span>{g.name}</span>
                    {on && <Heart className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div data-tour="ai-recs">
                <h2 className="text-white font-semibold text-base md:text-lg" style={{ letterSpacing: '-0.02em' }}>
                  Your AI-Curated Picks
                </h2>
                {userProfile && (
                  <p className="text-white/35 text-xs">
                    {recStats.count} picks · {recStats.accuracy}% match · {userProfile.personalityType}
                  </p>
                )}
              </div>
            </div>

            {isLoadingRecs && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 animate-pulse">
                    <div className="rounded-lg bg-white/8" style={{ aspectRatio: '2/3' }} />
                    <div className="h-3 rounded bg-white/7 w-3/4" />
                    <div className="h-2.5 rounded bg-white/5 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingRecs && movies.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {movies.map((movie, index) => (
                  <MovieCard
                    key={`${movie.id}-${index}`}
                    movie={movie}
                    index={index}
                    onWatchlist={addToWatchlist}
                    onRate={rateMovie}
                    existingRating={userRatings[String(movie.id)]}
                  />
                ))}
              </div>
            )}

            {!isLoadingRecs && movies.length === 0 && (
              <div
                className="rounded-xl p-10 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-5xl mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">AI needs your taste profile</h3>
                <p className="text-white/40 text-sm mb-5">Complete the onboarding to get personalised picks.</p>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}
                >
                  Start AI Training
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
