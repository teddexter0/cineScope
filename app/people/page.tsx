// app/people/page.tsx - Favorite People with auto-created category tabs

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, User, Plus, Trash2, Search, Star, Mic2, Film, Video, Users } from 'lucide-react'
import { persistentStorage } from '@/lib/persistent-storage'

type CategoryTab = 'all' | 'directors' | 'actors' | 'music' | 'other'

function getDepartmentCategory(department: string | undefined): CategoryTab {
  const dept = (department || '').toLowerCase()
  if (dept === 'directing') return 'directors'
  if (dept === 'acting') return 'actors'
  if (dept === 'sound' || dept === 'music') return 'music'
  return 'other'
}

const CATEGORY_META: Record<CategoryTab, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'All People', icon: <Users className="w-4 h-4" />, color: 'text-purple-300' },
  directors: { label: 'Directors', icon: <Video className="w-4 h-4" />, color: 'text-blue-300' },
  actors: { label: 'Actors', icon: <Film className="w-4 h-4" />, color: 'text-green-300' },
  music: { label: 'Singers & Artists', icon: <Mic2 className="w-4 h-4" />, color: 'text-pink-300' },
  other: { label: 'Other', icon: <User className="w-4 h-4" />, color: 'text-yellow-300' },
}

export default function FavoritePeoplePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [favoritePeople, setFavoritePeople] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')

  useEffect(() => {
    if (status === 'authenticated') {
      loadFavorites()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const loadFavorites = () => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const favorites = persistentStorage.getFavoritePeople(userEmail)
      setFavoritePeople(favorites)
    } catch (error) {
      console.error('Load error:', error)
      setFavoritePeople([])
    } finally {
      setIsLoading(false)
    }
  }

  // Derive which tabs to show (only show a category tab if there's at least one person in it)
  const visibleTabs = useMemo<CategoryTab[]>(() => {
    const cats = new Set<CategoryTab>(['all'])
    favoritePeople.forEach(p => cats.add(getDepartmentCategory(p.known_for_department)))
    const ORDER: CategoryTab[] = ['all', 'directors', 'actors', 'music', 'other']
    return ORDER.filter(t => cats.has(t))
  }, [favoritePeople])

  // Filtered list for the active tab
  const displayedPeople = useMemo(() => {
    if (activeTab === 'all') return favoritePeople
    return favoritePeople.filter(p => getDepartmentCategory(p.known_for_department) === activeTab)
  }, [favoritePeople, activeTab])

  const searchPeople = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      showNotification('Please enter at least 2 characters to search', 'error')
      return
    }
    setIsSearching(true)
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}&type=person`)
      const data = await response.json()
      if (data.success && data.results) {
        setSearchResults(data.results)
        showNotification(`Found ${data.results.length} people for "${searchQuery}"`, 'success')
      } else {
        setSearchResults([])
        showNotification('Search failed: ' + (data.error || 'No results'), 'error')
      }
    } catch (error) {
      setSearchResults([])
      showNotification('Network error during search', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  const addToFavorites = (person: any) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const success = persistentStorage.addFavoritePerson(userEmail, person)
      if (success) {
        const updatedFavorites = persistentStorage.getFavoritePeople(userEmail)
        setFavoritePeople(updatedFavorites)
        // Auto-switch to that person's category tab
        const cat = getDepartmentCategory(person.known_for_department)
        setActiveTab(cat)
        showNotification(`${person.name} added to favorites!`, 'success')
        setSearchResults([])
        setSearchQuery('')
      } else {
        showNotification(`${person.name} is already in your favorites!`, 'error')
      }
    } catch (error) {
      showNotification('Error adding to favorites', 'error')
    }
  }

  const removeFromFavorites = (personId: number) => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const person = favoritePeople.find(p => p.id === personId)
      const success = persistentStorage.removeFavoritePerson(userEmail, personId)
      if (success) {
        const updatedFavorites = persistentStorage.getFavoritePeople(userEmail)
        setFavoritePeople(updatedFavorites)
        showNotification(`${person?.name || 'Person'} removed from favorites`, 'success')
      }
    } catch (error) {
      showNotification('Error removing from favorites', 'error')
    }
  }

  const getImageUrl = (path: string | null) => {
    if (path) return `https://image.tmdb.org/t/p/w500${path}`
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
      <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="300" fill="#4F46E5"/>
        <circle cx="100" cy="80" r="25" fill="white" opacity="0.8"/>
        <rect x="75" y="120" width="50" height="80" rx="25" fill="white" opacity="0.8"/>
        <text x="100" y="220" text-anchor="middle" fill="white" font-size="12">No Photo</text>
      </svg>
    `)
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const existing = document.querySelectorAll('.people-notification')
    existing.forEach(n => n.remove())
    const notification = document.createElement('div')
    notification.className = `people-notification fixed top-4 right-4 px-6 py-3 rounded-lg font-bold shadow-lg z-50 ${
      type === 'success'
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading favorite people...</div>
        </div>
      </div>
    )
  }

  const userEmail = session?.user?.email || 'demo@user.com'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-white hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400" />
            Favorite People
          </h1>
          <p className="text-purple-200">
            {favoritePeople.length} favorite {favoritePeople.length === 1 ? 'person' : 'people'} saved
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-white text-xl mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search for People
          </h2>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPeople()}
                placeholder="Search actors, directors, singers… (e.g. 'Nolan', 'Beyoncé', 'Zendaya')"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <button
              onClick={searchPeople}
              disabled={isSearching || searchQuery.length < 2}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors min-w-[120px]"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-lg mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Search Results ({searchResults.length})
              </h3>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {searchResults.map((person) => {
                  const cat = getDepartmentCategory(person.known_for_department)
                  const meta = CATEGORY_META[cat]
                  return (
                    <div key={person.id} className="bg-white/10 rounded-lg p-4 flex items-center gap-4 hover:bg-white/15 transition-colors">
                      <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={getImageUrl(person.profile_path)}
                          alt={person.name}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-person.jpg' }}
                        />
                      </div>

                      <div className="flex-1">
                        <h4 className="text-white font-medium text-lg">{person.name}</h4>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 ${meta.color}`}>
                          {meta.icon}
                          {person.known_for_department || 'Actor'}
                        </span>
                        {person.popularity && (
                          <p className="text-white/50 text-sm mt-1">Popularity: {person.popularity.toFixed(1)}</p>
                        )}
                        {person.known_for && person.known_for.length > 0 && (
                          <p className="text-white/60 text-sm">
                            Known for: {person.known_for.slice(0, 2).map((item: any) => item.title || item.name).join(', ')}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => addToFavorites(person)}
                        disabled={persistentStorage.isPersonInFavorites(userEmail, person.id)}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
                        title={persistentStorage.isPersonInFavorites(userEmail, person.id) ? 'Already in favorites' : 'Add to favorites'}
                      >
                        {persistentStorage.isPersonInFavorites(userEmail, person.id) ? '✓' : <Plus className="w-5 h-5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {searchQuery.length > 1 && searchResults.length === 0 && !isSearching && (
            <div className="mt-4 text-center text-white/60">
              No people found for "{searchQuery}". Try a different name or spelling.
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {favoritePeople.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {visibleTabs.map(tab => {
              const meta = CATEGORY_META[tab]
              const count = tab === 'all' ? favoritePeople.length : favoritePeople.filter(p => getDepartmentCategory(p.known_for_department) === tab).length
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-white/25 text-white border border-white/40'
                      : 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/15'
                  }`}
                >
                  <span className={meta.color}>{meta.icon}</span>
                  {meta.label}
                  <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Favorites Grid */}
        <div>
          <h2 className="text-white text-xl mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            {activeTab === 'all' ? 'Your Favorite People' : `Favorite ${CATEGORY_META[activeTab].label}`}
          </h2>

          {favoritePeople.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Favorite People Yet</h3>
              <p className="text-white/70 text-lg mb-6">Search above to find and add your favorite actors, directors, and artists!</p>
              <div className="text-white/60 text-sm">
                Try: "Ryan Gosling", "Greta Gerwig", "Beyoncé", "Christopher Nolan"
              </div>
            </div>
          ) : displayedPeople.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
              <div className="text-4xl mb-3">{CATEGORY_META[activeTab].icon}</div>
              <p className="text-white/70">No {CATEGORY_META[activeTab].label.toLowerCase()} added yet. Search above to find some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {displayedPeople.map((person) => {
                const cat = getDepartmentCategory(person.known_for_department)
                const meta = CATEGORY_META[cat]
                return (
                  <div key={person.id} className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden border border-white/20 group hover:border-purple-400/50 transition-all">
                    <div className="aspect-[2/3] relative bg-gray-700">
                      <Image
                        src={getImageUrl(person.profile_path)}
                        alt={person.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                        onError={(e) => { e.currentTarget.src = '/placeholder-person.jpg' }}
                      />

                      {/* Category badge */}
                      <div className={`absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.icon}
                      </div>

                      <button
                        onClick={() => removeFromFavorites(person.id)}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {person.name}
                      </h3>
                      <p className={`text-xs mb-1 ${meta.color}`}>
                        {person.known_for_department}
                      </p>
                      {person.popularity > 0 && (
                        <p className="text-white/50 text-xs">
                          ⭐ {person.popularity.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {favoritePeople.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              People Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">{favoritePeople.length}</div>
                <div className="text-white/60 text-sm">Total People</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {favoritePeople.filter(p => getDepartmentCategory(p.known_for_department) === 'directors').length}
                </div>
                <div className="text-white/60 text-sm">Directors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">
                  {favoritePeople.filter(p => getDepartmentCategory(p.known_for_department) === 'actors').length}
                </div>
                <div className="text-white/60 text-sm">Actors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-300">
                  {favoritePeople.filter(p => getDepartmentCategory(p.known_for_department) === 'music').length}
                </div>
                <div className="text-white/60 text-sm">Singers & Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">
                  {favoritePeople.length > 0
                    ? (favoritePeople.reduce((sum, p) => sum + (p.popularity || 0), 0) / favoritePeople.length).toFixed(1)
                    : '0.0'}
                </div>
                <div className="text-white/60 text-sm">Avg Popularity</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
