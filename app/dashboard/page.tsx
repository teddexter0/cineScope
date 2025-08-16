// app/dashboard/page.tsx
'use client'

import { smartAIEngine } from '@/lib/smart-ai-recommendation-engine'
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



// AI RECOMMENDATION ENGINE - REAL IMPLEMENTATION
class AIRecommendationEngine {
  private tmdbApiKey = 'da4d264a4290972d086e0d21dce7cfeb' // Your TMDB API key

  // Analyze user's onboarding responses with REAL AI logic
  analyzePersonality(responses: Record<number, string>) {
    const analysis = {
      favoriteMovie: responses[1] || '',
      relatedCharacter: responses[2] || '',
      mood: responses[3] || '',
      preference: responses[4] || '',
      importance: responses[5] || '',
      genre: responses[6] || '',
      favoriteActors: responses[7] || '',
      dealbreakers: responses[8] || ''
    }

    console.log('🧠 AI Analyzing user responses:', analysis)

    // AI Analysis based on responses
    const personalityProfile = {
      preferredGenres: this.extractGenres(analysis),
      personalityType: this.determinePersonalityType(analysis),
      moodPreferences: this.analyzeMoodPreferences(analysis),
      complexityLevel: this.determineComplexity(analysis),
      aiInsight: this.generateAIInsight(analysis)
    }

    console.log('🎯 AI Personality Profile:', personalityProfile)
    return personalityProfile
  }

  private extractGenres(analysis: any): Record<string, number> {
    const genreWeights: Record<string, number> = {}
    
    // Analyze all text responses for genre keywords
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    // Direct genre selection
    if (analysis.genre.includes('Drama')) genreWeights['18'] = 0.9
    if (analysis.genre.includes('Comedy')) genreWeights['35'] = 0.9
    if (analysis.genre.includes('Action')) genreWeights['28'] = 0.9
    if (analysis.genre.includes('Romance')) genreWeights['10749'] = 0.8
    if (analysis.genre.includes('Horror')) genreWeights['27'] = 0.8
    if (analysis.genre.includes('Sci-Fi')) genreWeights['878'] = 0.8
    if (analysis.genre.includes('Mystery')) genreWeights['9648'] = 0.7
    if (analysis.genre.includes('Documentary')) genreWeights['99'] = 0.7

    // Mood-based genre inference
    if (analysis.mood.includes('excitement') || analysis.mood.includes('thrills')) {
      genreWeights['28'] = (genreWeights['28'] || 0) + 0.7 // Action
      genreWeights['53'] = (genreWeights['53'] || 0) + 0.6 // Thriller
    }
    if (analysis.mood.includes('comfort') || analysis.mood.includes('relaxed')) {
      genreWeights['35'] = (genreWeights['35'] || 0) + 0.6 // Comedy
      genreWeights['10749'] = (genreWeights['10749'] || 0) + 0.5 // Romance
    }
    if (analysis.mood.includes('depth') || analysis.mood.includes('thoughtful')) {
      genreWeights['18'] = (genreWeights['18'] || 0) + 0.8 // Drama
      genreWeights['99'] = (genreWeights['99'] || 0) + 0.6 // Documentary
    }

    // Text analysis for movie preferences
    if (allText.includes('action') || allText.includes('fight') || allText.includes('adventure')) {
      genreWeights['28'] = (genreWeights['28'] || 0) + 0.7
    }
    if (allText.includes('funny') || allText.includes('laugh') || allText.includes('comedy')) {
      genreWeights['35'] = (genreWeights['35'] || 0) + 0.8
    }
    if (allText.includes('emotional') || allText.includes('cry') || allText.includes('touching')) {
      genreWeights['18'] = (genreWeights['18'] || 0) + 0.8
    }
    if (allText.includes('scary') || allText.includes('horror') || allText.includes('suspense')) {
      genreWeights['27'] = (genreWeights['27'] || 0) + 0.8
    }
    if (allText.includes('love') || allText.includes('romantic')) {
      genreWeights['10749'] = (genreWeights['10749'] || 0) + 0.7
    }
    if (allText.includes('space') || allText.includes('future') || allText.includes('sci-fi')) {
      genreWeights['878'] = (genreWeights['878'] || 0) + 0.8
    }

    return genreWeights
  }

  private determinePersonalityType(analysis: any): string {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    if (allText.includes('complex') || allText.includes('challenge') || allText.includes('depth')) {
      return 'Intellectual Explorer'
    }
    if (allText.includes('emotional') || allText.includes('feel') || allText.includes('relate')) {
      return 'Emotional Connector'
    }
    if (allText.includes('fun') || allText.includes('entertainment') || allText.includes('laugh')) {
      return 'Entertainment Seeker'
    }
    if (allText.includes('escape') || allText.includes('different') || allText.includes('adventure')) {
      return 'Escapist Explorer'
    }
    
    return 'Balanced Viewer'
  }

  private analyzeMoodPreferences(analysis: any): string[] {
    const preferences = []
    const mood = analysis.mood.toLowerCase()
    
    if (mood.includes('comfort')) preferences.push('comforting')
    if (mood.includes('excitement')) preferences.push('thrilling')
    if (mood.includes('depth')) preferences.push('thought-provoking')
    if (mood.includes('adventure')) preferences.push('adventurous')
    if (mood.includes('romantic')) preferences.push('romantic')
    if (mood.includes('laugh')) preferences.push('humorous')
    
    return preferences.length > 0 ? preferences : ['entertaining']
  }

  private determineComplexity(analysis: any): number {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    let complexity = 0.5
    
    if (allText.includes('complex') || allText.includes('challenge') || allText.includes('deep')) {
      complexity += 0.3
    }
    if (allText.includes('simple') || allText.includes('easy') || allText.includes('straightforward')) {
      complexity -= 0.2
    }
    if (analysis.preference.includes('challenge')) {
      complexity += 0.2
    }
    if (analysis.preference.includes('comfort')) {
      complexity -= 0.1
    }
    
    return Math.max(0.2, Math.min(1.0, complexity))
  }

  private generateAIInsight(analysis: any): string {
    const personalityType = this.determinePersonalityType(analysis)
    const topMood = this.analyzeMoodPreferences(analysis)[0] || 'entertaining'
    const complexity = this.determineComplexity(analysis)
    
    let insight = `Based on your responses, you're a ${personalityType} who appreciates ${topMood} content. `
    
    if (complexity > 0.7) {
      insight += "You enjoy sophisticated narratives with layered storytelling and complex character development. "
    } else if (complexity < 0.4) {
      insight += "You prefer accessible, well-crafted stories that entertain without overwhelming complexity. "
    } else {
      insight += "You enjoy a good balance of engaging plots with just the right amount of depth. "
    }
    
    const favoriteMovie = analysis.favoriteMovie
    if (favoriteMovie && favoriteMovie.length > 10) {
      insight += `Your appreciation for films like those you mentioned shows your taste for quality storytelling.`
    }
    
    return insight
  }

  // REAL MOVIE FETCHING from TMDB API
  async fetchPersonalizedMovies(genreWeights: Record<string, number>, personalityType: string): Promise<any[]> {
    try {
      console.log('🎬 Fetching movies for genres:', genreWeights)
      
      // Get top 2 preferred genres
      const topGenres = Object.entries(genreWeights)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([genreId]) => genreId)

      console.log('🎯 Top genres:', topGenres)

      const allMovies: any[] = []

      // Fetch movies for each top genre
      for (const genreId of topGenres) {
        const movies = await this.fetchMoviesByGenre(genreId)
        allMovies.push(...movies)
      }

      // Also get some highly rated mixed content
      const popularMovies = await this.fetchPopularMovies()
      allMovies.push(...popularMovies)

      // Remove duplicates and filter
      const uniqueMovies = this.removeDuplicates(allMovies)
      
      // Sort by AI relevance score
      const scoredMovies = uniqueMovies.map(movie => ({
        ...movie,
        aiScore: this.calculateAIScore(movie, genreWeights, personalityType)
      })).sort((a, b) => b.aiScore - a.aiScore)

      console.log('🏆 Final AI-scored movies:', scoredMovies.slice(0, 12))
      return scoredMovies.slice(0, 12)
      
    } catch (error) {
      console.error('❌ Error fetching personalized movies:', error)
      // Fallback to trending movies if API fails
      return await this.fetchTrendingMoviesPublic()
    }
  }

  private async fetchMoviesByGenre(genreId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`
      )
      const data = await response.json()
      return data.results?.slice(0, 6) || []
    } catch (error) {
      console.error(`Error fetching genre ${genreId}:`, error)
      return []
    }
  }

  private async fetchPopularMovies(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}&page=1`
      )
      const data = await response.json()
      return data.results?.slice(0, 4) || []
    } catch (error) {
      console.error('Error fetching popular movies:', error)
      return []
    }
  }

  // FIXED: Made this public method
  async fetchTrendingMoviesPublic(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${this.tmdbApiKey}`
      )
      const data = await response.json()
      return data.results?.slice(0, 12) || []
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      return []
    }
  }

  private removeDuplicates(movies: any[]): any[] {
    const seen = new Set()
    return movies.filter(movie => {
      if (seen.has(movie.id)) return false
      seen.add(movie.id)
      return movie.poster_path && movie.vote_average > 6.0 // Quality filter
    })
  }

  private calculateAIScore(movie: any, genreWeights: Record<string, number>, personalityType: string): number {
    let score = movie.vote_average * 10 // Base quality score

    // Genre matching bonus
    if (movie.genre_ids) {
      movie.genre_ids.forEach((genreId: number) => {
        const weight = genreWeights[genreId.toString()]
        if (weight) {
          score += weight * 50 // Big bonus for matching genres
        }
      })
    }

    // Personality type bonuses
    if (personalityType === 'Intellectual Explorer' && movie.vote_average > 7.5) {
      score += 30 // Prefer critically acclaimed films
    }
    if (personalityType === 'Entertainment Seeker' && movie.popularity > 100) {
      score += 25 // Prefer popular entertainment
    }
    if (personalityType === 'Emotional Connector' && movie.genre_ids?.includes(18)) {
      score += 35 // Drama bonus
    }

    // Release date relevance (prefer recent but not too recent)
    const releaseYear = new Date(movie.release_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const yearDiff = currentYear - releaseYear
    if (yearDiff >= 2 && yearDiff <= 15) {
      score += 15 // Sweet spot for established but not too old movies
    }

    return score
  }
}

// Initialize AI Engine
const aiEngine = new AIRecommendationEngine()

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
// Add this search function to your Dashboard component:
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

// Update your search input onChange to use debounced search:
const debouncedSearch = useCallback(
  debounce((query: string) => handleSearch(query), 500),
  []
)

  
// Add this search functionality to your dashboard - UPDATE your existing dashboard

// Add these state variables to your Dashboard component:
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
  // REPLACE the loadAIPersonalizedRecommendations function in app/dashboard/page.tsx with this:

const loadAIPersonalizedRecommendations = async () => {
  setIsLoadingRecommendations(true)
  
  try {
    console.log('🤖 Starting SMART AI recommendation process...')
    
    const onboardingAnswers = localStorage.getItem('onboardingAnswers')
    if (!onboardingAnswers) {
      router.push('/onboarding')
      return
    }

    const responses = JSON.parse(onboardingAnswers)
    console.log('📝 User responses:', responses)

    // AI Analysis with existing engine
    const profile = aiEngine.analyzePersonality(responses)
    setUserProfile(profile)
    setAiInsight(profile.aiInsight)

    // Use the existing generateIntelligentRecommendations method
    const smartRecommendations = await smartAIEngine.generateIntelligentRecommendations(profile)
    
    // NEW: Also try keyword search
    const keywordResults = await smartAIEngine.generateIntelligentKeywordSearch(profile)
    
    // Combine results
    const allResults = [...smartRecommendations, ...keywordResults]
    const uniqueResults = smartAIEngine.removeDuplicates(allResults)

    if (uniqueResults.length > 0) {
      setMovies(uniqueResults.slice(0, 12))
      setRecommendationStats(prev => ({
        ...prev,
        discovered: uniqueResults.length,
        accuracy: Math.min(99, 88 + Object.keys(profile.preferredGenres).length * 2)
      }))
      console.log('✅ SMART AI recommendations loaded successfully!', uniqueResults.length, 'movies')
    } else {
      const fallbackMovies = await smartAIEngine.getFallbackRecommendations()
      setMovies(fallbackMovies)
      setAiInsight("We're still learning your preferences. Here are some popular movies to get started!")
    }

  } catch (error) {
    console.error('❌ Error loading SMART AI recommendations:', error)
    
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

// Replace your existing handleAddToWatchlist function with this:
const handleAddToWatchlist = async (movie: any) => {
  try {
    console.log('🎬 Adding to watchlist:', movie.title)
    
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        overview: movie.overview
      })
    })

    const data = await response.json()
    console.log('📋 Watchlist response:', data)
    
    if (response.ok && data.success) {
      showNotification(`✅ ${movie.title} added to watchlist!`, 'success')
      
      // Update the button state visually
      const button = document.querySelector(`[data-movie-id="${movie.id}"] .watchlist-btn`)
      if (button) {
        button.textContent = '✓ Added'
        button.classList.add('bg-green-500', 'hover:bg-green-600')
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700')
      }
    } else {
      if (data.error === 'Movie already in watchlist') {
        showNotification(`📋 ${movie.title} is already in your watchlist`, 'error')
      } else {
        showNotification(`❌ Failed to add ${movie.title}: ${data.error || 'Unknown error'}`, 'error')
      }
    }
  } catch (error) {
    console.error('❌ Watchlist error:', error)
    showNotification(`❌ Network error adding ${movie.title}. Please try again.`, 'error')
  }
}

// Update your handleLikeMovie function in app/dashboard/page.tsx:

const handleLikeMovie = async (movie: any) => {
  try {
    console.log('👍 Liking movie:', movie.title)
    
    const response = await fetch('/api/movies/rate', {  // Changed from /ratings to /rate
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        rating: 8.5,
        review: 'Loved this AI recommendation! 🤖'
      })
    })

    const data = await response.json()
    console.log('⭐ Rating response:', data)
    
    if (response.ok && data.success) {
      showNotification(`💖 Loved ${movie.title}! Check your ratings page to see it.`, 'success')
      
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
    } else {
      showNotification(`❌ Failed to like ${movie.title}: ${data.error || 'Unknown error'}`, 'error')
    }
  } catch (error) {
    console.error('❌ Like error:', error)
    showNotification(`❌ Network error liking ${movie.title}. Please try again.`, 'error')
  }
}

// IMPROVED NOTIFICATION SYSTEM - Replace your existing functions:
const showNotification = (message: string, type: 'success' | 'error') => {
  // Remove any existing notifications
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
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 100)
  
  // Animate out and remove
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
    // AI-themed placeholder
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

// Also add this helper function for debouncing:
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
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* YouTube Trailer Background */}
      <YouTubeTrailerBackground 
        autoplay={true}
        muted={true}
        showControls={false}
        loop={true}
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
              <h1 className="text-xl md:text-2xl font-bold text-white">CineScope</h1>
              {userProfile && (
                <div className="hidden md:flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
                  <Brain className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200 text-sm font-medium">{userProfile.personalityType}</span>
                </div>
              )}
            </div>
            
            <nav className="flex items-center gap-2 md:gap-4">
              <button
                onClick={loadAIPersonalizedRecommendations}
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
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Welcome Back,
                <br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {session?.user?.name?.split(' ')[0] || 'Movie Lover'}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
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
      placeholder="Search movies, actors, directors..."
      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-12 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
    />
    {isSearching && (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
  </div>

  {/* Search Results Dropdown */}
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
                if (result.media_type === 'movie' || !result.media_type) {
                  // Add movie to current viewing
                  setMovies(prev => [result, ...prev.slice(0, 11)])
                }
                setShowSearchResults(false)
                setSearchQuery('')
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
                    {result.media_type === 'person' ? '👤' : '🎬'}
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
                     result.media_type || 'Movie'}
                  </span>
                  {result.release_date && (
                    <>
                      <span>•</span>
                      <span>{new Date(result.release_date).getFullYear()}</span>
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
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (result.media_type === 'movie' || !result.media_type) {
                    handleAddToWatchlist(result)
                  }
                }}
                className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 p-2 rounded-lg transition-colors"
                title="Add to watchlist"
              >
                <Plus className="w-4 h-4" />
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
                          {movie.title}
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