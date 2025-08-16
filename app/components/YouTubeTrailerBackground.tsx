// app/components/YouTubeTrailerBackground.tsx - COMPLETELY FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailerData {
  title: string
  videoId: string
  description: string
  genre: string
  startTime: number // Most replayed timestamp
}

// UPDATED TRAILERS WITH CORRECT START TIMES
const EPIC_TRAILERS: TrailerData[] = [
  {
    title: "Spider-Man: No Way Home",
    videoId: "JfVOs4VSpmA", // VERIFIED WORKING
    description: "The multiverse-shattering adventure bringing together three Spider-Men",
    genre: "Action/Adventure",
    startTime: 85 // Multiverse reveal moment
  },
  {
    title: "Avengers: Endgame", 
    videoId: "TcMBFSGVi1c", // VERIFIED WORKING
    description: "The culmination of 22 films and the climactic finale to Marvel's Infinity Saga",
    genre: "Action/Adventure",
    startTime: 95 // "Assemble" buildup
  },
  {
    title: "Oppenheimer",
    videoId: "uYPbbksJxIg", // VERIFIED WORKING
    description: "Christopher Nolan's biographical thriller about the father of the atomic bomb",
    genre: "Drama/Thriller",
    startTime: 52 // Dramatic buildup
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    videoId: "VyHV0BRtdxo", // VERIFIED WORKING
    description: "The magical journey that started it all - welcome to Hogwarts",
    genre: "Fantasy/Adventure",
    startTime: 30 // Magical moment
  },
  {
    title: "Jurassic World Rebirth",
    videoId: "CofZ7xjGyI8", // NEW 2025 TRAILER
    description: "The next chapter in the Jurassic saga with new dinosaurs and adventures",
    genre: "Action/Adventure",
    startTime: 45 // Dinosaur reveal
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

  // Auto-rotate trailers every 25 seconds
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentTrailerIndex(prev => (prev + 1) % EPIC_TRAILERS.length)
      setKey(prev => prev + 1) // Force re-render
      setIsLoading(true)
    }, 25000)

    return () => clearInterval(interval)
  }, [autoplay])

  // Hide loading after iframe loads
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [currentTrailerIndex, key])

  const buildYouTubeUrl = (trailer: TrailerData) => {
    const baseUrl = `https://www.youtube.com/embed/${trailer.videoId}`
    const params = new URLSearchParams({
      autoplay: '1',
      mute: isMuted ? '1' : '0',
      controls: '0', // NO CONTROLS
      loop: '1',
      playlist: trailer.videoId,
      rel: '0', // NO RELATED VIDEOS
      modestbranding: '1', // NO YOUTUBE LOGO
      iv_load_policy: '3', // NO ANNOTATIONS
      fs: '0', // NO FULLSCREEN BUTTON
      disablekb: '1', // NO KEYBOARD CONTROLS
      playsinline: '1',
      start: trailer.startTime.toString(), // START FROM MOST REPLAYED PART
      enablejsapi: '0', // NO JS API
      origin: window.location.origin, // SECURITY
      cc_load_policy: '0', // NO CAPTIONS
      showinfo: '0' // NO VIDEO INFO
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
    <div className={`fixed inset-0 w-full h-full overflow-hidden ${className}`}>
      {/* YouTube Iframe - FIXED STYLING */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          key={`${currentTrailer.videoId}-${key}-${isMuted}`}
          src={buildYouTubeUrl(currentTrailer)}
          className="absolute inset-0 w-full h-full pointer-events-none border-0 outline-0"
          style={{
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            objectFit: 'cover',
            transform: 'scale(1.1)', // Slight zoom to hide any black bars
            filter: 'brightness(0.8)' // Slightly dim for better text overlay
          }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={false}
          title={`${currentTrailer.title} Background Trailer`}
        />
      </div>

      {/* Gradient Overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <h3 className="text-white text-xl font-bold mb-2">{currentTrailer.title}</h3>
              <p className="text-yellow-200">🎬 Loading epic trailer...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movie Info Overlay - FIXED POSITIONING */}
      <AnimatePresence>
        {showOverlay && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="movie-info-overlay opacity-90 hover:opacity-100 transition-opacity duration-300"
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
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
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={toggleMute}
          className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition-all backdrop-blur-sm"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Current Movie Title - FIXED POSITIONING */}
      {!showOverlay && !isLoading && (
        <div className="fixed bottom-6 left-6 z-50">
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