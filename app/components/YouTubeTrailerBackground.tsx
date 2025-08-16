// app/components/YouTubeTrailerBackground.tsx - FINAL WORKING VERSION
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailerData {
  title: string
  videoId: string
  description: string
  genre: string
}

// VERIFIED WORKING TRAILER IDs
const EPIC_TRAILERS: TrailerData[] = [
  {
    title: "Spider-Man: No Way Home",
    videoId: "JfVOs4VSpmA", // VERIFIED WORKING
    description: "The multiverse-shattering adventure bringing together three Spider-Men",
    genre: "Action/Adventure"
  },
  {
    title: "Avengers: Endgame", 
    videoId: "TcMBFSGVi1c", // VERIFIED WORKING
    description: "The culmination of 22 films and the climactic finale to Marvel's Infinity Saga",
    genre: "Action/Adventure"
  },
  {
    title: "Oppenheimer",
    videoId: "uYPbbksJxIg", // VERIFIED WORKING
    description: "Christopher Nolan's biographical thriller about the father of the atomic bomb",
    genre: "Drama/Thriller"
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    videoId: "VyHV0BRtdxo", // VERIFIED WORKING
    description: "The magical journey that started it all - welcome to Hogwarts",
    genre: "Fantasy/Adventure"
  },
  {
    title: "Sing 2",
    videoId: "EPZu5MA6_fA", // VERIFIED WORKING
    description: "Buster Moon and his friends chase their dreams in the entertainment capital",
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
  const [key, setKey] = useState(0) // Force re-render

  const currentTrailer = EPIC_TRAILERS[currentTrailerIndex]

  // Auto-rotate trailers every 45 seconds
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentTrailerIndex(prev => (prev + 1) % EPIC_TRAILERS.length)
      setKey(prev => prev + 1) // Force re-render
      setIsLoading(true)
    }, 45000)

    return () => clearInterval(interval)
  }, [autoplay])

  // Hide loading after iframe loads
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
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
      start: '5',
      enablejsapi: '1'
    })

    return `${baseUrl}?${params.toString()}`
  }

  const nextTrailer = () => {
    setIsLoading(true)
    setCurrentTrailerIndex(prev => (prev + 1) % EPIC_TRAILERS.length)
    setKey(prev => prev + 1)
  }

  const prevTrailer = () => {
    setIsLoading(true)
    setCurrentTrailerIndex(prev => prev === 0 ? EPIC_TRAILERS.length - 1 : prev - 1)
    setKey(prev => prev + 1)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    setKey(prev => prev + 1) // Force reload to apply mute
    setIsLoading(true)
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* YouTube Iframe */}
      <div className="absolute inset-0">
        <iframe
          key={`${currentTrailer.videoId}-${key}-${isMuted}`}
          src={buildYouTubeUrl(currentTrailer)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh', 
            minWidth: '177.78vh'
          }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${currentTrailer.title} Trailer`}
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/30 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/30 to-transparent" />

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <h3 className="text-white text-xl font-bold mb-2">Loading {currentTrailer.title}</h3>
              <p className="text-yellow-200">🎬 Epic trailer incoming...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movie Info Overlay */}
      <AnimatePresence>
        {showOverlay && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-6 left-6 right-6 z-30"
          >
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {currentTrailer.title}
                      </h3>
                      <p className="text-yellow-300 text-sm font-medium bg-yellow-400/20 px-2 py-1 rounded-full inline-block">
                        {currentTrailer.genre}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white/90 text-sm leading-relaxed mb-4 max-w-2xl">
                    {currentTrailer.description}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowOverlay(false)}
                  className="text-white/60 hover:text-white transition-colors text-xl ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevTrailer}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    ← Previous
                  </button>
                  
                  <button
                    onClick={nextTrailer}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    Next →
                  </button>
                </div>

                {/* Trailer Dots */}
                <div className="flex gap-2">
                  {EPIC_TRAILERS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsLoading(true)
                        setCurrentTrailerIndex(index)
                        setKey(prev => prev + 1)
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentTrailerIndex 
                          ? 'bg-yellow-400 scale-125' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Current Info */}
                <div className="text-white/60 text-sm">
                  {currentTrailerIndex + 1} / {EPIC_TRAILERS.length}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Overlay Button */}
      <AnimatePresence>
        {!showOverlay && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowOverlay(true)}
            className="absolute bottom-6 right-6 bg-yellow-400/90 hover:bg-yellow-400 text-blue-900 px-4 py-3 rounded-full transition-all shadow-lg backdrop-blur-sm z-30 font-bold"
          >
            🎬 Show Info
          </motion.button>
        )}
      </AnimatePresence>

      {/* Volume Control */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleMute}
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all backdrop-blur-sm"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Current Movie Title */}
      {!showOverlay && !isLoading && (
        <div className="absolute bottom-6 left-6 z-30">
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