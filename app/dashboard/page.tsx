// app/dashboard/page.tsx - COMPLETE FIXED VERSION

'use client'
 
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Film, 
  Search, 
  Star, 
  Plus, 
  ThumbsUp, 
  Clock, 
  TrendingUp,
  Sparkles,
  User,
  Settings,
  LogOut,
  Brain,
  Zap,
  Target
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'
import { hybridAIEngine } from '@/lib/hybrid-ai-recommendation-engine'
import { persistentStorage } from '@/lib/persistent-storage'

// Debounce helper function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [movies, setMovies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aiInsight, setAiInsight] = useState('')
  const [recommendationStats, setRecommendationStats] = useState({
    accuracy: 95,
    discovered: 0,
    timeSaved: 12
  })

  // Search functionality
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      // Check if user completed onboarding
      const onboardingComplete = localStorage.getItem('onboardingCompleted')
      if (!onboardingComplete) {
        router.push('/onboarding')
        return
      }
      
      setIsLoading(false)
      loadAIPersonalizedRecommendations()
    }
  }, [status, router])

  const handleAddPersonToFavorites = (person: any) => {
  try {
    const userEmail = session?.user?.email || 'demo@user.com'
    console.log('🎭 Adding person to favorites from dashboard:', person.name)
    
    // Use the same persistent storage as people page
    const success = persistentStorage.addFavoritePerson(userEmail, person)
    
    if (success) {
      showNotification(`✅ ${person.name} added to favorite people! Check your People page to see them.`, 'success')
      
      // Close search
      setShowSearchResults(false)
      setSearchQuery('')
      
      console.log('🎉 Successfully added person from dashboard:', person.name)
    } else {
      showNotification(`📋 ${person.name} is already in your favorite people!`, 'error')
    }
  } catch (error) {
    console.error('❌ Error adding person to favorites:', error)
    showNotification(`❌ Error adding ${person.name} to favorites. Please try again.`, 'error')
  }
}
  // ENHANCED AI RECOMMENDATION LOADING - FIXED ASYNC/AWAIT
  const loadAIPersonalizedRecommendations = async () => {
    setIsLoadingRecommendations(true)
    
    try {
      console.log('🤖 Starting ENHANCED AI recommendation process...')
      
      const onboardingAnswers = localStorage.getItem('onboardingAnswers')
      if (!onboardingAnswers) {
        router.push('/onboarding')
        return
      }

      const responses = JSON.parse(onboardingAnswers)
      console.log('📝 User responses:', responses)

      // AI Analysis with hybrid engine - FIXED: properly await the Promise
      const profile = await hybridAIEngine.analyzePersonality(responses)
      setUserProfile(profile)
      setAiInsight(profile.aiInsight)

      // Use the NEW enhanced recommendations (includes TV shows!)
      const enhancedRecommendations = await hybridAIEngine.generateEnhancedRecommendations(profile)
      
      // Also try keyword search for variety
      const keywordResults = await hybridAIEngine.generateIntelligentKeywordSearch(profile)
      
      // Combine and dedupe
      const allResults = [...enhancedRecommendations, ...keywordResults]
      const uniqueResults = hybridAIEngine.removeDuplicates(allResults)

      if (uniqueResults.length > 0) {
        setMovies(uniqueResults.slice(0, 12))
        setRecommendationStats(prev => ({
          ...prev,
          discovered: uniqueResults.length,
          // FIXED: properly access preferredGenres from awaited profile
          accuracy: Math.min(99, 88 + Object.keys(profile.preferredGenres || {}).length * 2)
        }))
        console.log('✅ ENHANCED AI recommendations loaded!', uniqueResults.length, 'movies & TV shows')
      } else {
        const fallbackMovies = await hybridAIEngine.getFallbackRecommendations()
        setMovies(fallbackMovies)
        setAiInsight("We're still learning your preferences. Here are some popular picks to get started!")
      }

    } catch (error) {
      console.error('❌ Error loading ENHANCED AI recommendations:', error)
      
      try {
        const fallbackMovies = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=da4d264a4290972d086e0d21dce7cfeb`)
          .then(res => res.json())
          .then(data => data.results?.slice(0, 12) || [])
        
        setMovies(fallbackMovies)
        setAiInsight("Having trouble with advanced AI. These are trending movies!")
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError)
        setAiInsight("Please refresh the page to try again!")
      }
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // WORKING REFRESH AI BUTTON - FIXED ASYNC/AWAIT
  const handleRefreshAI = async () => {
    setIsLoadingRecommendations(true)
    
    try {
      console.log('🔄 Refreshing AI with fresh content...')
      
      const onboardingAnswers = localStorage.getItem('onboardingAnswers')
      if (!onboardingAnswers) {
        router.push('/onboarding')
        return
      }

      const responses = JSON.parse(onboardingAnswers)
      // FIXED: properly await the analyzePersonality call
      const profile = await hybridAIEngine.analyzePersonality(responses)
      
      // Use the NEW refresh method with force refresh
      const freshRecs = await hybridAIEngine.refreshRecommendations(profile, true)
      setMovies(freshRecs)
      
      setRecommendationStats(prev => ({
        ...prev,
        discovered: freshRecs.length,
        accuracy: Math.min(99, prev.accuracy + 2)
      }))
      
      showNotification('🔄 Fresh AI recommendations loaded with TV shows!', 'success')
      console.log('✅ Fresh recommendations loaded:', freshRecs.length, 'items')
      
    } catch (error) {
      console.error('❌ Refresh error:', error)
      showNotification('❌ Failed to refresh recommendations. Please try again.', 'error')
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  // SEARCH FUNCTIONALITY
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&type=multi`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.results)
        setShowSearchResults(true)
        console.log('🔍 Search results:', data.results)
      } else {
        console.error('Search failed:', data.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((query: string) => handleSearch(query), 500),
    []
  )

  // WATCHLIST FUNCTIONALITY - USING PERSISTENT STORAGE
  const handleAddToWatchlist = async (movie: any) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      console.log('🎬 Adding to watchlist:', movie.title || movie.name || 'Unknown Movie')
      
      // Use persistent storage for immediate response
      const success = persistentStorage.addToWatchlist(userEmail, movie)
      
      if (success) {
        showNotification(`✅ ${movie.title || movie.name || 'Movie'} added to watchlist!`, 'success')
        
        // Update the button state visually
        const button = document.querySelector(`[data-movie-id="${movie.id}"] .watchlist-btn`)
        if (button) {
          button.textContent = '✓ Added'
          button.classList.add('bg-green-500', 'hover:bg-green-600')
          button.classList.remove('bg-blue-600', 'hover:bg-blue-700')
        }
        
        // Optional: Sync to server in background
        try {
          await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              movieId: movie.id,
              title: movie.title || movie.name || movie.displayTitle || 'Unknown Movie',
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date || movie.first_air_date,
              overview: movie.overview || 'No description available'
            })
          })
        } catch (apiError) {
          console.log('📡 Background sync failed (not critical):', apiError)
        }
      } else {
        showNotification(`📋 ${movie.title || movie.name || 'Movie'} is already in your watchlist`, 'error')
      }
    } catch (error) {
      console.error('❌ Watchlist error:', error)
      showNotification(`❌ Error adding ${movie.title || movie.name || 'movie'}. Please try again.`, 'error')
    }
  }

  // RATING FUNCTIONALITY - USING PERSISTENT STORAGE
  const handleLikeMovie = async (movie: any) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      console.log('👍 Liking movie:', movie.title || movie.name || movie.displayTitle || 'Unknown Movie')
      
      const ratingData = {
        movieId: movie.id,
        title: movie.title || movie.name || movie.displayTitle || 'Unknown Movie',
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        rating: 8.5,
        review: `Loved this AI recommendation! 🤖 ${movie.title || movie.name || movie.displayTitle || 'This content'} was exactly what I was looking for.`,
        media_type: movie.media_type || 'movie'
      }
      
      // Use persistent storage for immediate response
      const success = persistentStorage.addRating(userEmail, ratingData)
      
      if (success) {
        showNotification(`💖 Loved ${movie.title || movie.name || movie.displayTitle || 'this content'}! Check your ratings page to see it.`, 'success')
        
        // Update accuracy when user likes recommendations
        setRecommendationStats(prev => ({
          ...prev,
          accuracy: Math.min(99, prev.accuracy + 1)
        }))
        
        // Update the button state visually
        const button = document.querySelector(`[data-movie-id="${movie.id}"] .like-btn`)
        if (button) {
          button.textContent = '💖 Loved'
          button.classList.add('bg-pink-500', 'hover:bg-pink-600')
          button.classList.remove('bg-gradient-to-r', 'from-yellow-400', 'to-orange-500')
        }
        
        // Optional: Sync to server in background
        try {
          await fetch('/api/movies/rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ratingData)
          })
        } catch (apiError) {
          console.log('📡 Background rating sync failed (not critical):', apiError)
        }
      }
    } catch (error) {
      console.error('❌ Like error:', error)
      showNotification(`❌ Network error liking ${movie.title || movie.name || movie.displayTitle || 'content'}. Please try again.`, 'error')
    }
  }

  // NOTIFICATION SYSTEM
  const showNotification = (message: string, type: 'success' | 'error') => {
    const existingNotifications = document.querySelectorAll('.notification')
    existingNotifications.forEach(notification => notification.remove())

    const notification = document.createElement('div')
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg font-bold shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (posterPath) {
      return `https://image.tmdb.org/t/p/w500${posterPath}`
    }
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="300" height="450" fill="url(#grad)"/>
        <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="48">🤖</text>
        <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">AI Curated</text>
      </svg>
    `)}`
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* YouTube Trailer Background - Dashboard Version */}
      <YouTubeTrailerBackground 
        autoplay={true}
        muted={true}
        showControls={false}
        loop={true}
        isDashboard={true}
        className="absolute inset-0 z-0"
      />

      {/* Main Content Overlay */}
      <div className="relative z-10 min-h-screen bg-black/30 backdrop-blur-[2px]">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Film className="w-4 h-4 md:w-6 md:h-6 text-blue-900" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">CineScope</h1>
              {userProfile && (
                <div className="hidden md:flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
                  <Brain className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200 text-sm font-medium">{userProfile.personalityType}</span>
                </div>
              )}
            </div>
            
            <nav className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleRefreshAI}
                disabled={isLoadingRecommendations}
                className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm text-purple-200 px-3 py-2 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden md:inline">{isLoadingRecommendations ? 'AI Thinking...' : 'Refresh AI'}</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-white/20 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{session?.user?.name || 'User'}</span>
                </button>
                 
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 py-2">
                    <button
                      onClick={() => router.push('/watchlist')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      My Watchlist
                    </button>
                    <button
                      onClick={() => router.push('/ratings')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      My Ratings
                    </button>
                    <button
                      onClick={() => router.push('/people')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Favorite People
                    </button>
                    <button
                      onClick={() => router.push('/social')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Social
                    </button>
                    <button
                      onClick={() => router.push('/onboarding')}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      Retrain AI
                    </button>
                    <div className="border-t border-white/20 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative px-4 py-10 md:px-6 md:py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Welcome Back,
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {session?.user?.name?.split(' ')[0] || 'Movie Lover'}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                {isLoadingRecommendations ? (
                  <>🧠 AI is analyzing your personality and curating perfect matches...</>
                ) : (
                  <>Your AI has analyzed your taste and found perfect matches. These recommendations are personally crafted for you.</>
                )}
              </p>
 
              {/* IMPROVED Search Bar with Live Results */}
              <div className="max-w-2xl mx-auto mb-8 relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const query = e.target.value
                      setSearchQuery(query)
                      debouncedSearch(query)
                    }}
                    placeholder="Search movies, TV shows, actors, directors..."
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-12 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                
{/* FIXED Search Results Dropdown */}
{showSearchResults && searchResults.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 max-h-96 overflow-y-auto z-50"
  >
    <div className="p-4">
      <h3 className="text-white font-medium mb-3">Search Results</h3>
      <div className="space-y-2">
        {searchResults.map((result, index) => (
          <div
            key={result.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => {
              // Only add movies/TV to main view, not people
              if (result.media_type === 'movie' || result.media_type === 'tv' || !result.media_type) {
                setMovies(prev => [result, ...prev.slice(0, 11)])
                setShowSearchResults(false)
                setSearchQuery('')
              }
            }}
          >
            {/* Image */}
            <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
              {(result.poster_path || result.profile_path) ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${result.poster_path || result.profile_path}`}
                  alt={result.title || result.name}
                  width={48}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                  {result.media_type === 'person' ? '👤' : result.media_type === 'tv' ? '📺' : '🎬'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">
                {result.title || result.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="capitalize">
                  {result.media_type === 'movie' ? 'Movie' : 
                   result.media_type === 'person' ? 'Person' : 
                   result.media_type === 'tv' ? 'TV Show' : 'Movie'}
                </span>
                {(result.release_date || result.first_air_date) && (
                  <>
                    <span>•</span>
                    <span>{new Date(result.release_date || result.first_air_date).getFullYear()}</span>
                  </>
                )}
                {result.vote_average > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{result.vote_average.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
              {result.known_for && result.known_for.length > 0 && (
                <p className="text-xs text-white/50 truncate">
                  Known for: {result.known_for.slice(0, 2).map((item: any) => item.title || item.name).join(', ')}
                </p>
              )}
              {result.known_for_department && (
                <p className="text-xs text-white/50">
                  {result.known_for_department}
                </p>
              )}
            </div>

            {/* FIXED: Action Button with proper person handling */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                console.log('🔍 Search result clicked:', result.media_type, result.name || result.title)
                
                if (result.media_type === 'person') {
                  // FIXED: Use the function we defined above
                  handleAddPersonToFavorites(result)
                } else if (result.media_type === 'movie' || result.media_type === 'tv' || !result.media_type) {
                  handleAddToWatchlist(result)
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                result.media_type === 'person' 
                  ? 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300' 
                  : 'bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300'
              }`}
              title={result.media_type === 'person' ? 'Add to favorite people' : 'Add to watchlist'}
            >
              {result.media_type === 'person' ? (
                <User className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
)}

                {/* No Results */}
                {showSearchResults && searchResults.length === 0 && searchQuery.length > 1 && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 p-4 z-50"
                  >
                    <p className="text-white/60 text-center">No results found for "{searchQuery}"</p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* AI Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-400/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{recommendationStats.discovered}</div>
                    <div className="text-white/70 text-sm">AI Curated Movies</div>
                  </div>
                </div>
                <p className="text-white/60 text-xs">Personalized just for you</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{recommendationStats.timeSaved}h</div>
                    <div className="text-white/70 text-sm">Time Saved</div>
                  </div>
                </div>
                <p className="text-white/60 text-xs">No more endless browsing</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Loading State for AI Recommendations */}
        {isLoadingRecommendations && (
          <section className="px-4 pb-20 md:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"
                  />
                  <div className="text-left">
                    <h3 className="text-white font-bold text-xl mb-1">🧠 AI is Thinking...</h3>
                    <p className="text-purple-200 text-sm">Analyzing your personality and movie preferences</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Processing your responses
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span>
                    Matching personality profile
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🎯</span>
                    Curating perfect movies
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* AI Movie Recommendations */}
        {!isLoadingRecommendations && movies.length > 0 && (
          <section className="px-4 pb-20 md:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    🎯 Your AI-Curated Picks
                  </h2>
                </div>
                <p className="text-white/70">
                  Based on your personality analysis: <span className="text-purple-300 font-medium">{userProfile?.personalityType}</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4"
              >
                {movies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 relative">
                      {/* AI Score Badge */}
                      {movie.aiScore && (
                        <div className="absolute top-2 left-2 z-10 bg-purple-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                          <span className="text-white text-xs font-bold">
                            🤖 {Math.round(movie.aiScore)}
                          </span>
                        </div>
                      )}
                      
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <Image
                          src={getPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Hover Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-xs line-clamp-3">{movie.overview}</p>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {movie.displayTitle || movie.title || movie.name}
                          {movie.media_type === 'tv' && <span className="text-xs text-blue-300 ml-1">(Series)</span>}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-white/70 text-xs">{movie.vote_average?.toFixed(1)}</span>
                          </div>
                          <span className="text-white/50 text-xs">
                            {new Date(movie.release_date).getFullYear()}
                          </span>
                        </div>

                        <div className="flex gap-1 md:gap-2" data-movie-id={movie.id}>
                          <button 
                            onClick={() => handleLikeMovie(movie)}
                            className="like-btn flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-blue-900 py-1 px-1 md:px-2 rounded text-xs font-bold transition-all shadow-lg"
                            title="Love this AI pick!"
                          >
                            🤖👍
                          </button>
                          <button 
                            onClick={() => handleAddToWatchlist(movie)}
                            className="watchlist-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-1 md:px-2 rounded text-xs font-bold transition-all shadow-lg"
                            title="Add to watchlist"
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* AI Insight Box */}
              {aiInsight && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">🧠 AI Personality Insight</h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    {aiInsight}
                  </p>
                  
                  {userProfile && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="bg-purple-500/20 px-3 py-1 rounded-full">
                        <span className="text-purple-200 text-sm">Personality: {userProfile.personalityType}</span>
                      </div>
                      {userProfile.moodPreferences?.slice(0, 2).map((mood: string, index: number) => (
                        <div key={index} className="bg-blue-500/20 px-3 py-1 rounded-full">
                          <span className="text-blue-200 text-sm">Mood: {mood}</span>
                        </div>
                      ))}
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        <span className="text-green-200 text-sm">
                          Complexity: {userProfile.complexityLevel > 0.7 ? 'High' : userProfile.complexityLevel > 0.4 ? 'Medium' : 'Light'}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Improve AI Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={() => router.push('/onboarding')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <Brain className="w-5 h-5" />
                  Retrain AI with More Data
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Help your AI learn even more about your taste
                </p>
              </motion.div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoadingRecommendations && movies.length === 0 && (
          <section className="px-4 pb-20 md:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center"
              >
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-white mb-4">AI Needs More Data</h2>
                <p className="text-white/70 mb-6">
                  Complete your onboarding to get personalized recommendations!
                </p>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Start AI Training
                </button>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}