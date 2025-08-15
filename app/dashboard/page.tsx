'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  
  const [movies] = useState([
    { id: 1, title: 'The Matrix', year: 1999, genre: 'Sci-Fi' },
    { id: 2, title: 'Inception', year: 2010, genre: 'Thriller' },
    { id: 3, title: 'Interstellar', year: 2014, genre: 'Drama' },
    { id: 4, title: 'The Dark Knight', year: 2008, genre: 'Action' },
    { id: 5, title: 'Pulp Fiction', year: 1994, genre: 'Crime' },
    { id: 6, title: 'Forrest Gump', year: 1994, genre: 'Drama' },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      // Check if onboarding is completed
      const completed = localStorage.getItem('onboardingCompleted')
      if (!completed) {
        router.push('/onboarding')
        return
      }
      setOnboardingCompleted(true)
    }
    
    setIsLoading(false)
  }, [status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                🎬
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CineScope</h1>
                <p className="text-purple-200 text-sm">
                  Welcome back, {session?.user?.name || 'Movie Lover'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/onboarding')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                ⚙️ Preferences
              </button>
              <button className="p-2 text-white/60 hover:text-white transition-colors">
                ❤️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Your Personalized Recommendations
          </h2>
          <p className="text-purple-200 text-lg">
            Based on your preferences, here are movies you'll love
          </p>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {movies.map((movie) => (
            <div 
              key={movie.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all duration-300 group"
            >
              {/* Movie Poster Placeholder */}
              <div className="aspect-[2/3] bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
              
              {/* Movie Info */}
              <div className="p-6">
                <h3 className="font-semibold text-white mb-2 text-lg">
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-purple-200 text-sm">{movie.year}</span>
                  <span className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full">
                    {movie.genre}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-all text-sm">
                    👍 Like
                  </button>
                  <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition-all text-sm">
                    ➕ Watchlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
          <h3 className="text-yellow-200 font-semibold mb-2">🚧 Demo Mode Active</h3>
          <p className="text-yellow-200/80">
            These are sample recommendations. AI-powered personalization will be added in the next update!
          </p>
        </div>
      </div>
    </div>
  )
}