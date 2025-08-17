// app/people/page.tsx - FAVORITE PEOPLE PAGE

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  Search, 
  Star, 
  Heart, 
  ArrowLeft, 
  User, 
  Film, 
  Calendar,
  Plus,
  Trash2
} from 'lucide-react'

// In-memory storage for favorite people
const sessionFavoritePeople = new Map<string, any[]>()

export default function FavoritePeoplePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [favoritePeople, setFavoritePeople] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      loadFavoritePeople()
    }
  }, [status, router])

  const loadFavoritePeople = async () => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const userFavorites = sessionFavoritePeople.get(userEmail) || []
      setFavoritePeople(userFavorites)
      console.log('👥 Loaded favorite people:', userFavorites.length)
    } catch (error) {
      console.error('❌ Error loading favorite people:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => handleSearch(query), 500),
    []
  )

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&type=person`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.results || [])
        setShowSearchResults(true)
        console.log('🔍 Person search results:', data.results?.length || 0)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Person search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addToFavorites = async (person: any) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const userFavorites = sessionFavoritePeople.get(userEmail) || []
      
      // Check if already exists
      const exists = userFavorites.find(p => p.id === person.id)
      if (exists) {
        showNotification(`${person.name} is already in your favorites`, 'error')
        return
      }

      const favoriteItem = {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        known_for_department: person.known_for_department || 'Acting',
        known_for: person.known_for || [],
        popularity: person.popularity || 0,
        addedAt: new Date().toISOString()
      }

      userFavorites.push(favoriteItem)
      sessionFavoritePeople.set(userEmail, userFavorites)
      setFavoritePeople(userFavorites)

      showNotification(`✅ ${person.name} added to favorites!`, 'success')
      setShowSearchResults(false)
      setSearchQuery('')
    } catch (error) {
      console.error('❌ Error adding to favorites:', error)
      showNotification('Failed to add to favorites', 'error')
    }
  }

  const removeFromFavorites = async (personId: number) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const userFavorites = sessionFavoritePeople.get(userEmail) || []
      
      const personToRemove = userFavorites.find(p => p.id === personId)
      const updatedFavorites = userFavorites.filter(p => p.id !== personId)
      
      sessionFavoritePeople.set(userEmail, updatedFavorites)
      setFavoritePeople(updatedFavorites)

      showNotification(`🗑️ ${personToRemove?.name || 'Person'} removed from favorites`, 'success')
    } catch (error) {
      console.error('❌ Error removing from favorites:', error)
    }
  }

  const getProfileUrl = (profilePath: string | null) => {
    if (profilePath) {
      return `https://image.tmdb.org/t/p/w500${profilePath}`
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
        <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="48">👤</text>
        <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">Person</text>
      </svg>
    `)}`
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification')
    existingNotifications.forEach(n => n.remove())

    const notification = document.createElement('div')
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg font-bold shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400" />
            Favorite People
          </h1>
          <p className="text-purple-200">
            {favoritePeople.length} favorite actors & directors • Discover and track your favorite talent
          </p>
        </div>

        {/* Search Bar */}
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
              placeholder="Search for actors, directors, creators..."
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-12 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
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
                  {searchResults.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {/* Profile Image */}
                      <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={getProfileUrl(person.profile_path)}
                          alt={person.name}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {person.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <span>{person.known_for_department || 'Actor'}</span>
                          {person.popularity && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{person.popularity.toFixed(1)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {person.known_for && person.known_for.length > 0 && (
                          <p className="text-xs text-white/50 truncate">
                            Known for: {person.known_for.slice(0, 2).map((item: any) => item.title || item.name).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => addToFavorites(person)}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 p-2 rounded-lg transition-colors flex items-center gap-2"
                        title="Add to favorites"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Favorite People Grid */}
        {favoritePeople.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Favorite People Yet</h2>
            <p className="text-white/70 mb-6">Search and add your favorite actors, directors, and creators!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {favoritePeople.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden border border-white/20 hover:border-purple-400/50 transition-all duration-300">
                  {/* Profile Image */}
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <Image
                      src={getProfileUrl(person.profile_path)}
                      alt={person.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromFavorites(person.id)}
                      className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-300"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Person Info */}
                  <div className="p-3">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                      {person.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-xs">
                        {person.known_for_department || 'Actor'}
                      </span>
                      {person.popularity && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white/70 text-xs">{person.popularity.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Known For */}
                    {person.known_for && person.known_for.length > 0 && (
                      <div className="text-xs text-white/50 line-clamp-1">
                        {person.known_for.slice(0, 2).map((item: any) => item.title || item.name).join(', ')}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-white/40">
                      Added {new Date(person.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {favoritePeople.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Your Favorite People Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">{favoritePeople.length}</div>
                <div className="text-white/60 text-sm">Total People</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">
                  {favoritePeople.filter(p => p.known_for_department === 'Acting').length}
                </div>
                <div className="text-white/60 text-sm">Actors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">
                  {favoritePeople.filter(p => p.known_for_department === 'Directing').length}
                </div>
                <div className="text-white/60 text-sm">Directors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">
                  {favoritePeople.filter(p => !['Acting', 'Directing'].includes(p.known_for_department)).length}
                </div>
                <div className="text-white/60 text-sm">Other</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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