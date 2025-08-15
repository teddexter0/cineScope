
// Create: app/social/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'

export default function SocialPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      setIsLoading(false)
    }
  }, [status, router])

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
              className="text-white hover:text-purple-300 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">👥 Social Feed</h1>
          <p className="text-purple-200">Connect with other movie lovers</p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-white mb-4">Social Features Coming Soon</h2>
          <p className="text-white/70 mb-6">Connect with friends, share reviews, and discover movies together!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl mb-2">👫</div>
              <h3 className="text-white font-medium mb-1">Find Friends</h3>
              <p className="text-white/60 text-sm">Connect with users who have similar taste</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="text-white font-medium mb-1">Share Reviews</h3>
              <p className="text-white/60 text-sm">Write and read movie reviews</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="text-white font-medium mb-1">Top Lists</h3>
              <p className="text-white/60 text-sm">Create and share your favorite movies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}