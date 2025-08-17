// app/people/page.tsx - MINIMAL VERSION (CRASH-PROOF)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { ArrowLeft, User, Plus, Trash2, Search } from 'lucide-react'

export default function FavoritePeoplePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [favoritePeople, setFavoritePeople] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Get consistent storage key
  const getStorageKey = () => {
    const email = session?.user?.email || 'demo@user.com'
    return `cinescope_favorite_people_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  // Load favorites on mount
  useEffect(() => {
    if (status === 'authenticated') {
      try {
        const stored = localStorage.getItem(getStorageKey())
        const favorites = stored ? JSON.parse(stored) : []
        setFavoritePeople(favorites)
        console.log('✅ Loaded', favorites.length, 'favorite people')
      } catch (error) {
        console.error('❌ Load error:', error)
        setFavoritePeople([])
      }
    }
  }, [status])

  // Save to localStorage
  const saveFavorites = (newFavorites: any[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(newFavorites))
      console.log('💾 Saved', newFavorites.length, 'favorites')
      return true
    } catch (error) {
      console.error('❌ Save error:', error)
      return false
    }
  }

  // Search function
  const searchPeople = async () => {
    if (!searchQuery || searchQuery.length < 2) return
    
    setIsSearching(true)
    
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}&type=person`)
      const data = await response.json()
      
      if (data.success && data.results) {
        setSearchResults(data.results)
        console.log('🔍 Found', data.results.length, 'people')
      } else {
        setSearchResults([])
        alert('Search failed: ' + (data.error || 'No results'))
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search error: ' + error.message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Add to favorites
  const addToFavorites = (person: any) => {
    try {
      // Check if already exists
      if (favoritePeople.find(p => p.id === person.id)) {
        alert(person.name + ' is already in favorites!')
        return
      }

      const newPerson = {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        known_for_department: person.known_for_department || 'Acting',
        popularity: person.popularity || 0,
        addedAt: new Date().toISOString()
      }

      const updated = [...favoritePeople, newPerson]
      setFavoritePeople(updated)
      
      if (saveFavorites(updated)) {
        alert('✅ ' + person.name + ' added to favorites!')
        setSearchResults([])
        setSearchQuery('')
      } else {
        alert('❌ Failed to save favorite')
        setFavoritePeople(favoritePeople) // revert
      }
    } catch (error) {
      console.error('Add error:', error)
      alert('Error adding to favorites')
    }
  }

  // Remove from favorites
  const removeFromFavorites = (personId: number) => {
    try {
      const person = favoritePeople.find(p => p.id === personId)
      const updated = favoritePeople.filter(p => p.id !== personId)
      setFavoritePeople(updated)
      saveFavorites(updated)
      alert('🗑️ ' + (person?.name || 'Person') + ' removed from favorites')
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  // FIXED: Simple placeholder image without btoa
  const getImageUrl = (path: string | null) => {
    if (path) {
      return `https://image.tmdb.org/t/p/w500${path}`
    }
    // Use a simple CSS gradient instead of SVG with emoji
    return '/api/placeholder/person' // We'll create a simple API endpoint
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

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
            {favoritePeople.length} favorite people saved
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-white text-xl mb-4">Search for People</h2>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPeople()}
                placeholder="Type a name like 'Zendaya' and click Search"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <button
              onClick={searchPeople}
              disabled={isSearching || searchQuery.length < 2}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-lg mb-3">Search Results ({searchResults.length})</h3>
              <div className="grid gap-3 max-h-80 overflow-y-auto">
                {searchResults.map((person) => (
                  <div key={person.id} className="bg-white/10 rounded-lg p-4 flex items-center gap-4">
                    <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : '/placeholder-person.jpg'}
                        alt={person.name}
                        width={64}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-person.jpg'
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg">{person.name}</h4>
                      <p className="text-white/70">{person.known_for_department || 'Actor'}</p>
                      {person.popularity && (
                        <p className="text-white/50 text-sm">Popularity: {person.popularity.toFixed(1)}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => addToFavorites(person)}
                      className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors"
                      title="Add to favorites"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Favorites Grid */}
        <div>
          <h2 className="text-white text-xl mb-4">Your Favorite People</h2>
          
          {favoritePeople.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Favorite People Yet</h3>
              <p className="text-white/70 text-lg">Search above to find and add your favorite actors and directors!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {favoritePeople.map((person) => (
                <div key={person.id} className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden border border-white/20 group hover:border-purple-400/50 transition-all">
                  <div className="aspect-[2/3] relative bg-gray-700">
                    <Image
                      src={person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : '/placeholder-person.jpg'}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-person.jpg'
                      }}
                    />
                    
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
                    <p className="text-white/60 text-xs">
                      {person.known_for_department}
                    </p>
                    {person.popularity > 0 && (
                      <p className="text-white/50 text-xs mt-1">
                        ⭐ {person.popularity.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}