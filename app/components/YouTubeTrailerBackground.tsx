// app/components/YouTubeTrailerBackground.tsx - DASHBOARD VERSION WITH TV SHOWS

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailerData {
  title: string
  videoId: string
  description: string
  genre: string
  startTime: number
}

// NEW TV SHOWS & MOVIES FOR DASHBOARD
const DASHBOARD_TRAILERS: TrailerData[] = [
  {
    title: "Suits",
    videoId: "85z53bAebsI", // Suits Final Season trailer
    description: "The brilliant lawyer drama that redefined legal television with Harvey Specter and Mike Ross",
    genre: "Legal Drama",
    startTime: 30
  },
  {
    title: "The Flash",
    videoId: "Yj0l7iGKh8g", // The Flash Season 1 trailer
    description: "The fastest man alive races through Central City fighting metahumans and saving the world",
    genre: "Superhero/Sci-Fi",
    startTime: 45
  },
  {
    title: "Supergirl", 
    videoId: "Lm46-envrHo", // Supergirl Season 1 trailer
    description: "Kara Zor-El embraces her powers to become National City's greatest protector",
    genre: "Superhero/Action",
    startTime: 40
  },
  {
    title: "Fast & Furious 7",
    videoId: "Skpu5HaVkOc", // Fast & Furious 7 official trailer
    description: "Dominic Toretto and his crew face their most dangerous enemy yet in this action-packed finale",
    genre: "Action/Thriller",
    startTime: 60
  },
  {
    title: "Avatar: The Last Airbender",
    videoId: "ooVvH2IYz0w", // Your specific ATLA trailer
    description: "Aang's epic journey to master the elements and save the world from the Fire Nation",
    genre: "Animation/Adventure", 
    startTime: 25
  },
  {
    title: "Spider-Man: No Way Home",
    videoId: "JfVOs4VSpmA", // Keep this popular one
    description: "The multiverse-shattering adventure bringing together three Spider-Men",
    genre: "Action/Adventure",
    startTime: 85
  }
]

interface YouTubeTrailerBackgroundProps {
  autoplay?: boolean
  showControls?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
  isDashboard?: boolean // New prop to detect dashboard usage
}

export default function YouTubeTrailerBackground({
  autoplay = true,
  showControls = false, 
  muted = true,
  loop = true,
  className = "",
  isDashboard = false
}: YouTubeTrailerBackgroundProps) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(muted)
  const [key, setKey] = useState(0)

  // Choose trailer list based on usage
  const trailerList = isDashboard ? DASHBOARD_TRAILERS : DASHBOARD_TRAILERS // Use new list everywhere
  const currentTrailer = trailerList[currentTrailerIndex]

  // Auto-rotate trailers - SEAMLESS SWITCHING (no fade)
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentTrailerIndex(prev => (prev + 1) % trailerList.length)
      setKey(prev => prev + 1) // Force re-render for seamless switch
      setIsLoading(true) // Brief loading for seamless transition
    }, 25000) // 25 seconds per trailer

    return () => clearInterval(interval)
  }, [autoplay, trailerList.length])

  // Quick loading for seamless transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500) // Faster loading
    return () => clearTimeout(timer)
  }, [currentTrailerIndex, key])

  const buildYouTubeUrl = (trailer: TrailerData) => {
    const baseUrl = `https://www.youtube.com/embed/${trailer.videoId}`
    const params = new URLSearchParams({
      autoplay: '1',
      mute: isMuted ? '1' : '0',
      controls: '0',
      loop: '1',
      playlist: trailer.videoId,
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      fs: '0',
      disablekb: '1',
      playsinline: '1',
      start: trailer.startTime.toString(),
      enablejsapi: '0',
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://cinescope.app',
      cc_load_policy: '0',
      showinfo: '0'
    })

    return `${baseUrl}?${params.toString()}`
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    setKey(prev => prev + 1)
    setIsLoading(true)
  }

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden ${className}`}>
      {/* YouTube Iframe - FULL COVERAGE FOR MOBILE */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          key={`${currentTrailer.videoId}-${key}-${isMuted}`}
          src={buildYouTubeUrl(currentTrailer)}
          className="absolute inset-0 pointer-events-none border-0 outline-0"
          style={{
            width: '100vw',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            // MOBILE FIX: Cover entire screen even if it looks weird
            transform: window.innerWidth < 768 ? 'scale(1.5)' : 'scale(1.1)',
            transformOrigin: 'center center',
            objectFit: 'cover',
            filter: 'brightness(0.7) contrast(1.1)'
          }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={false}
          title={`${currentTrailer.title} Background Trailer`}
        />
      </div>

      {/* Enhanced Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />

      {/* SEAMLESS Loading State (minimal) */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} // Faster transitions
            className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-white text-sm opacity-70">{currentTrailer.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume Control - ALWAYS VISIBLE */}
      <div className="fixed top-6 right-6 z-40">
        <button
          onClick={toggleMute}
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all backdrop-blur-sm"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Current Show Title - BOTTOM LEFT */}
      {!isLoading && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">
              Now Playing: <span className="text-yellow-300">{currentTrailer.title}</span>
            </p>
          </div>
        </div>
      )}

      {/* NO MOVIE INFO OVERLAY FOR DASHBOARD - REMOVED COMPLETELY */}
    </div>
  )
}