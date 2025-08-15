// Update your app/page.tsx to handle authentication better

'use client'

import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Film, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  Star,
  Users,
  Clock,
  Zap
} from 'lucide-react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Don't auto-redirect - let users access the homepage
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    // Stay on homepage after sign out
  }

  if (isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 md:p-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Film className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">CineScope</h1>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4">
            {session ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="bg-white/10 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-white/20 transition-all text-sm md:text-base"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="bg-white/10 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-white/20 transition-all text-sm md:text-base"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Hero Section - Mobile Responsive */}
      <section className="relative px-4 py-10 md:px-6 md:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 md:px-6 md:py-3 text-purple-200 mb-6 md:mb-8">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">AI-Powered Movie Discovery</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
              Never Wonder
              <br className="md:hidden" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}What to Watch{' '}
              </span>
              Again
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              CineScope uses advanced AI to understand your unique taste and deliver movie recommendations 
              so perfect, you'll feel like we're reading your mind.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16 px-4"
          >
            {session ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4 md:w-5 md:h-5" />
                  See How It Works
                </Link>
              </>
            )}
          </motion.div>

          {/* Stats - Mobile Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto px-4"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-purple-400 mb-2">95%</div>
              <div className="text-white/80 text-sm md:text-base">Recommendation Accuracy</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-pink-400 mb-2">2M+</div>
              <div className="text-white/80 text-sm md:text-base">Movies Analyzed</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-2">10s</div>
              <div className="text-white/80 text-sm md:text-base">To Perfect Match</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rest of your homepage content - make it mobile responsive */}
    </div>
  )
}