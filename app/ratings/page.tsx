// Create: app/ratings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Heart, Calendar, ArrowLeft } from 'lucide-react'

export default function RatingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [ratings, setRatings] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      loadRatings()
    }
  }, [status, router])

  const loadRatings = async () => {
    try {
      const response = await fetch('/api/movies/rate')  // Changed from /ratings to /rate
      const data = await response.json()
      
      console.log('⭐ Ratings API response:', data)
      
      if (data.success) {
        setRatings(data.ratings || [])
        console.log('⭐ Loaded ratings:', data.ratings?.length || 0, 'items')
      }
    } catch (error) {
      console.error('❌ Error loading ratings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (posterPath) {
      return `https://image.tmdb.org/t/p/w500${posterPath}`
    }
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="450" fill="#374151"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48">⭐</text>
      </svg>
    `)}`
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
            <Heart className="w-8 h-8 text-red-400" />
            My Ratings & Liked Movies
          </h1>
          <p className="text-purple-200">
            {ratings.length} movies rated • Your taste profile grows stronger with each rating
          </p>
        </div>

        {/* Ratings Content */}
        {ratings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Ratings Yet</h2>
            <p className="text-white/70 mb-6">Start rating movies to help our AI learn your taste!</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Discover Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratings.map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-purple-400/50 transition-all duration-300"
              >
                {/* Movie Poster & Info */}
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-28 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={getPosterUrl(rating.poster_path)}
                      alt={rating.title || 'Movie'}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                      sizes="80px"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                      {rating.title || 'Unknown Movie'}
                    </h3>
                    
                    {/* Rating Display */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(rating.rating / 2) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-yellow-400 font-bold">
                        {rating.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {rating.review && (
                  <div className="px-4 pb-4">
                    <div className="bg-white/5 rounded-lg p-3 border-l-4 border-purple-400">
                      <p className="text-white/90 text-sm italic line-clamp-3">
                        "{rating.review}"
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {ratings.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Rating Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">{ratings.length}</div>
                <div className="text-white/60 text-sm">Movies Rated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">
                  {(ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)}
                </div>
                <div className="text-white/60 text-sm">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">
                  {ratings.filter(r => r.rating >= 8).length}
                </div>
                <div className="text-white/60 text-sm">Loved (8+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {ratings.filter(r => r.review && r.review.length > 10).length}
                </div>
                <div className="text-white/60 text-sm">Reviewed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}