// app/page.tsx - FIXED COLORS & WORKING TRAILERS
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
import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
  }

  if (isLoading) {
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
      {/* 🎬 WORKING YOUTUBE TRAILERS BACKGROUND */}
      <YouTubeTrailerBackground 
        autoplay={true}
        muted={true}
        showControls={false}
        loop={true}
        className="absolute inset-0 z-0"
      />

      {/* Main Content with Better Overlay */}
      <div className="relative z-10 min-h-screen bg-black/30 backdrop-blur-[1px]">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Film className="w-4 h-4 md:w-6 md:h-6 text-blue-900" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white">CineScope</h1>
            </div>
            
            <nav className="flex items-center gap-2 md:gap-4">
              {session ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="bg-white/20 backdrop-blur-lg text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-white/30 transition-all text-sm md:text-base border border-white/30 font-medium"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="bg-white/20 backdrop-blur-lg text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-white/30 transition-all text-sm md:text-base border border-white/30 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/signin" 
                    className="text-white hover:text-yellow-300 transition-colors text-sm md:text-base font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-3 py-2 md:px-4 md:py-2 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all text-sm md:text-base font-bold shadow-xl"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </motion.header>

        {/* Hero Section - FIXED COLORS */}
        <section className="relative px-4 py-10 md:px-6 md:py-20">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-lg rounded-full px-4 py-2 md:px-6 md:py-3 text-yellow-300 mb-6 md:mb-8 border border-yellow-400/30">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-bold">AI-Powered Movie Discovery</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Never Wonder
                <br />
                {/* FIXED: Better contrast white text with subtle glow */}
                <span className="text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  What to Watch
                </span>
                <br />
                Again
              </h1>
              
              <div className="backdrop-blur-lg bg-black/30 rounded-2xl p-6 max-w-4xl mx-auto border border-white/20">
                <p className="text-lg md:text-xl text-white mb-6 md:mb-8 leading-relaxed">
                  CineScope uses advanced AI to understand your unique taste and deliver movie recommendations 
                  so perfect, you'll feel like we're reading your mind.
                </p>
              </div>
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
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 group shadow-2xl"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signup"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 group shadow-2xl"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="bg-black/40 backdrop-blur-lg text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 border border-white/30 shadow-xl"
                  >
                    <Brain className="w-4 h-4 md:w-5 md:h-5" />
                    See How It Works
                  </Link>
                </>
              )}
            </motion.div>

            {/* Stats with Better Contrast */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto px-4"
            >
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/30 shadow-xl">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">97%</div>
                <div className="text-white text-sm md:text-base font-medium">AI Match Accuracy</div>
              </div>
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/30 shadow-xl">
                <div className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">2M+</div>
                <div className="text-white text-sm md:text-base font-medium">Movies Analyzed</div>
              </div>
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/30 shadow-xl">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">10s</div>
                <div className="text-white text-sm md:text-base font-medium">To Perfect Match</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative px-4 py-20 md:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                How CineScope AI Works
              </h2>
              <div className="backdrop-blur-lg bg-black/30 rounded-2xl p-6 max-w-4xl mx-auto border border-white/20">
                <p className="text-xl text-white">
                  Our advanced AI analyzes your personality and movie preferences to deliver recommendations that feel like magic.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/30 text-center shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Brain className="w-8 h-8 text-blue-900" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">1. Personality Analysis</h3>
                <p className="text-white/90">
                  Our AI analyzes your responses to understand your unique movie personality and preferences.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/30 text-center shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-8 h-8 text-blue-900" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">2. Smart Matching</h3>
                <p className="text-white/90">
                  We match your profile against millions of movies to find perfect matches for your taste.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/30 text-center shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Star className="w-8 h-8 text-blue-900" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">3. Perfect Recommendations</h3>
                <p className="text-white/90">
                  Get personalized movie suggestions that match your mood, time, and viewing preferences.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-4 py-20 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="bg-black/40 backdrop-blur-lg rounded-3xl p-12 border border-white/30 shadow-2xl"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Discover Your Next Favorite Movie?
              </h2>
              <p className="text-xl text-white mb-8">
                Join thousands of movie lovers who never wonder what to watch again.
              </p>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 inline-flex items-center gap-2 shadow-2xl"
              >
                Start Your AI Journey
                <Sparkles className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}