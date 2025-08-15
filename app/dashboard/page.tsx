'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'

interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [backgroundMovie, setBackgroundMovie] = useState<Movie | null>(null)

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
      loadMovies()
    }
  }, [status, router])

  const loadMovies = async () => {
    try {
      // Fetch trending movies with posters
      const response = await fetch(`/api/movies/trending`)
      if (response.ok) {
        const data = await response.json()
        setMovies(data.movies || [])
        if (data.movies?.length > 0) {
          setBackgroundMovie(data.movies[0])
        }
      }
    } catch (error) {
      console.error('Error loading movies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPosterUrl = (posterPath: string) => {
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder-poster.jpg'
  }

  const getBackdropUrl = (backdropPath: string) => {
    return backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Loading */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">🎬 Curating Your Perfect Movies</h2>
          <p className="text-purple-200">AI is analyzing your taste...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      
      {/* Dynamic Background */}
      {backgroundMovie && getBackdropUrl(backgroundMovie.backdrop_path) && (
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${getBackdropUrl(backgroundMovie.backdrop_path)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-indigo-900/80"></div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                🎬
              </motion.div>
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
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all hover:scale-105"
              >
                ⚙️ Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-4"
          >
            Your AI-Curated Movies
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-purple-200 text-xl"
          >
            Handpicked based on your unique personality profile
          </motion.p>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          {movies.map((movie, index) => (
            <motion.div 
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                
                {/* Movie Poster */}
                <div className="aspect-[2/3] relative overflow-hidden">
                  <img
                    src={getPosterUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-poster.jpg'
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-white text-sm font-medium">
                            {movie.vote_average.toFixed(1)}
                          </span>
                        </div>
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          95% Match
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs transition-all">
                          👍
                        </button>
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition-all">
                          ➕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Movie Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                    {movie.title}
                  </h3>
                  <p className="text-purple-200 text-xs">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">🧠 Your Movie DNA</h3>
            <p className="text-purple-200 text-lg mb-6">
              Based on your responses, you love character-driven narratives with emotional depth. 
              These recommendations match your preference for thoughtful storytelling and visual excellence.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🎭</div>
                <h4 className="text-white font-semibold mb-1">Character Focused</h4>
                <p className="text-purple-200 text-sm">You connect deeply with well-developed characters</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <h4 className="text-white font-semibold mb-1">Visual Storytelling</h4>
                <p className="text-purple-200 text-sm">Cinematography and aesthetics matter to you</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🧠</div>
                <h4 className="text-white font-semibold mb-1">Thought Provoking</h4>
                <p className="text-purple-200 text-sm">You enjoy films that challenge perspectives</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}