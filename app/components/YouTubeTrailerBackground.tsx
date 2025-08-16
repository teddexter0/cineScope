// app/components/YouTubeTrailerBackground.tsx - CORRECTED VERSION
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailerData {
  title: string
  videoId: string
  description: string
  genre: string
}

// YOUR REQUESTED SPECIFIC TRAILERS - CORRECTED!
const EPIC_TRAILERS: TrailerData[] = [
  {
    title: "Spider-Man: No Way Home",
    videoId: "JfVOs4VSpmA", // Official Sony Pictures trailer
    description: "The multiverse-shattering adventure bringing together three Spider-Men in an epic conclusion",
    genre: "Action/Adventure"
  },
  {
    title: "Avengers: Endgame",
    videoId: "TcMBFSGVi1c", // Official Marvel trailer
    description: "The culmination of 22 films and the climactic finale to Marvel's Infinity Saga",
    genre: "Action/Adventure"
  },
  {
    title: "Oppenheimer",
    videoId: "uYPbbksJxIg", // Official Universal Pictures trailer
    description: "Christopher Nolan's biographical thriller about J. Robert Oppenheimer and the atomic bomb",
    genre: "Drama/Thriller"
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    videoId: "VyHV0BRtdxo", // Official Warner Bros trailer
    description: "The magical journey that started it all - Harry discovers he's a wizard and enters Hogwarts",
    genre: "Fantasy/Adventure"
  },
  {
    title: "Sing 2",
    videoId: "EPZu5MA6_fA", // Official Illumination trailer
    description: "Buster Moon and his friends chase their dreams in the entertainment capital of the world",
    genre: "Animation/Family"
  }
]

interface YouTubeTrailerBackgroundProps {
  autoplay?: boolean
  showControls?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
}

export default function YouTubeTrailerBackground({
  autoplay = true,
  showControls = false,
  muted = true,
  loop = true,
  className = ""
}: YouTubeTrailerBackgroundProps) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showOverlay, setShowOverlay] = useState(true)
  const [isMuted, setIsMuted] = useState(muted)

  const currentTrailer = EPIC_TRAILERS[currentTrailerIndex]

  // BETTER TIMING: Auto-rotate every 60 seconds (full trailer length)
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentTrailerIndex(prev => (prev + 1) % EPIC_TRAILERS.length)
      setIsLoading(true)
    }, 60000) // 60 seconds - better timing!

    return () => clearInterval(interval)
  }, [autoplay])

  // Faster loading detection
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000) // Reduced to 2 seconds
    return () => clearTimeout(timer)
  }, [currentTrailerIndex])

  const buildYouTubeUrl = (trailer: TrailerData) => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: isMuted ? '1' : '0',
      controls: showControls ? '1' : '0',
      loop: loop ? '1' : '0',
      playlist: trailer.videoId,
      rel: '0', // No related videos
      modestbranding: '1', // Minimal YouTube branding
      iv_load_policy: '3', // Hide annotations
      fs: '0', // No fullscreen
      disablekb: '1', // No keyboard controls
      playsinline: '1', // Mobile optimization
      start: '3', // Skip first 3 seconds (logos)
      enablejsapi: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    })

    return `https://www.youtube.com/embed/${trailer.videoId}?${params}`
  }

  const nextTrailer = () => {
    setIsLoading(true)
    setCurrentTrailerIndex(prev => (prev + 1) % EPIC_TRAILERS.length)
  }

  const prevTrailer = () => {
    setIsLoading(true)
    setCurrentTrailerIndex(prev => prev === 0 ? EPIC_TRAILERS.length - 1 : prev - 1)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    setIsLoading(true)
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* YouTube Iframe Container - IMPROVED STYLING */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTrailer.videoId}-${isMuted}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.5, ease: "easeInOut" }} // Smoother transition
            className="w-full h-full"
          >
            <iframe
              src={buildYouTubeUrl(currentTrailer)}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{
                width: '100vw',
                height: '56.25vw', // 16:9 aspect ratio
                minHeight: '100vh',
                minWidth: '177.78vh', // 16:9 aspect ratio
                transform: 'translate(-50%, -50%)',
              }}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${currentTrailer.title} Trailer`}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* IMPROVED GRADIENTS */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/40 to-transparent" />

      {/* BETTER LOADING STATE */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h3 className="text-white text-2xl font-bold mb-3">Loading {currentTrailer.title}</h3>
              <p className="text-yellow-200 text-lg">🎬 Preparing epic trailer experience...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMPROVED MOVIE INFO OVERLAY */}
      <AnimatePresence>
        {showOverlay && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-8 left-8 right-8 z-30"
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-3xl">🎬</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">
                        {currentTrailer.title}
                      </h3>
                      <p className="text-yellow-300 text-base font-medium bg-yellow-400/20 px-3 py-1 rounded-full inline-block">
                        {currentTrailer.genre}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white/90 text-base leading-relaxed mb-6 max-w-3xl">
                    {currentTrailer.description}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowOverlay(false)}
                  className="text-white/70 hover:text-white transition-colors text-2xl ml-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
              
              {/* BETTER NAVIGATION */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevTrailer}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium"
                  >
                    ← Previous
                  </button>
                  
                  <button
                    onClick={nextTrailer}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium"
                  >
                    Next →
                  </button>
                </div>

                {/* Trailer Dots - IMPROVED */}
                <div className="flex gap-3">
                  {EPIC_TRAILERS.map((trailer, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsLoading(true)
                        setCurrentTrailerIndex(index)
                      }}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentTrailerIndex 
                          ? 'bg-yellow-400 scale-125 shadow-lg' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      title={trailer.title}
                    />
                  ))}
                </div>

                {/* Current Trailer Info */}
                <div className="text-white/70 text-base font-medium">
                  {currentTrailerIndex + 1} / {EPIC_TRAILERS.length}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMPROVED SHOW OVERLAY BUTTON */}
      <AnimatePresence>
        {!showOverlay && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowOverlay(true)}
            className="absolute bottom-8 right-8 bg-yellow-400/90 hover:bg-yellow-400 text-blue-900 px-6 py-4 rounded-full transition-all shadow-2xl backdrop-blur-sm z-30 font-bold text-base"
          >
            🎬 Show Movie Info
          </motion.button>
        )}
      </AnimatePresence>

      {/* IMPROVED VOLUME CONTROL */}
      <div className="absolute top-8 right-8 z-30">
        <button
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all backdrop-blur-sm shadow-lg"
          title={isMuted ? "Unmute Trailer" : "Mute Trailer"}
        >
          <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      </div>

      {/* CURRENT MOVIE TITLE - BOTTOM LEFT */}
      {!showOverlay && !isLoading && (
        <div className="absolute bottom-8 left-8 z-30">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">
              Now Playing: <span className="text-yellow-300">{currentTrailer.title}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper hook for trailer management
export function useTrailerBackground() {
  const [isEnabled, setIsEnabled] = useState(true)
  
  const toggleTrailers = () => setIsEnabled(!isEnabled)
  
  return {
    isEnabled,
    toggleTrailers
  }
}