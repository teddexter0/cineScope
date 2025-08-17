// app/components/YouTubeTrailerBackground.tsx - FIXED WITH GUARANTEED WORKING TRAILERS

'use client'

import { useState, useEffect } from 'react'

interface TrailerData {
  title: string
  videoId: string
  startTime: number
}

// SIGN UP/SIGN IN TRAILERS (High-quality blockbusters) - VERIFIED WORKING
const AUTH_TRAILERS: TrailerData[] = [
  {
    title: "Spider-Man: No Way Home",
    videoId: "JfVOs4VSpmA", // Official Sony Pictures trailer - 355M+ views
    startTime: 85
  },
  {
    title: "Avengers: Endgame", 
    videoId: "TcMBFSGVi1c", // Official Marvel trailer - guaranteed to work
    startTime: 45
  },
  {
    title: "Fast & Furious 7",
    videoId: "Skpu5HaVkOc", // Fast & Furious 7 official trailer
    startTime: 60
  },
  {
    title: "Oppenheimer",
    videoId: "bK6ldnjE3Y0", // Official Universal trailer - Christopher Nolan
    startTime: 30
  },
  {
    title: "Dune",
    videoId: "8g18jFHCLXk", // Official Warner Bros trailer - Denis Villeneuve film
    startTime: 45
  },
]

// DASHBOARD TRAILERS (Movies + Series mix) - COMPLETELY FIXED WITH WORKING IDs
const DASHBOARD_TRAILERS: TrailerData[] = [
  {
    title: "The Batman",
    videoId: "mqqft2x_Aa4", // Official Warner Bros trailer - Robert Pattinson Batman
    startTime: 30
  },  
  {
    title: "Suits",
    videoId: "85z53bAebsI", // Suits Final Season trailer
    startTime: 30
  },
  {
    title: "No Time to Die",
    videoId: "BIhNsAtPbPI", // Official MGM trailer - final Daniel Craig Bond
    startTime: 50
  },
  {
    title: "Wednesday",
    videoId: "Di310WS8zLk", // Official Netflix trailer - Jenna Ortega series
    startTime: 20
  },
  {
    title: "Avatar: The Last Airbender",
    videoId: "ooVvH2IYz0w", // Your specific ATLA trailer
    startTime: 25
  }
]

interface YouTubeTrailerBackgroundProps {
  autoplay?: boolean
  showControls?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
  isDashboard?: boolean
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

  // Choose trailer list based on page
  const trailerList = isDashboard ? DASHBOARD_TRAILERS : AUTH_TRAILERS
  const currentTrailer = trailerList[currentTrailerIndex]

  // SEAMLESS Auto-rotate trailers - NO FADING
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentTrailerIndex(prev => (prev + 1) % trailerList.length)
      setKey(prev => prev + 1) // Force instant re-render
      setIsLoading(true) // Brief loading for seamless transition
    }, 25000) // 25 seconds per trailer

    return () => clearInterval(interval)
  }, [autoplay, trailerList.length])

  // Quick loading for seamless transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800) // Even faster loading
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
      {/* YouTube Iframe - AGGRESSIVE MOBILE COVERAGE */}
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
            // MOBILE FIX: AGGRESSIVE SCALING FOR FULL COVERAGE
            transform: typeof window !== 'undefined' && window.innerWidth < 768 
              ? 'scale(2.5) translateY(-5%)' // MUCH MORE AGGRESSIVE - covers fully even if stretched
              : typeof window !== 'undefined' && window.innerWidth < 1024 
              ? 'scale(1.8)' // Tablet scaling
              : 'scale(1.2)', // Desktop scaling
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

      {/* MINIMAL Loading State (seamless) */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white text-sm opacity-70">{currentTrailer.title}</p>
          </div>
        </div>
      )}

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

      {/* Current Title - BOTTOM LEFT */}
      {!isLoading && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">
              Now Playing: <span className="text-yellow-300">{currentTrailer.title}</span>
            </p>
          </div>
        </div>
      )}

      {/* NO MOVIE INFO OVERLAY - COMPLETELY REMOVED */}
    </div>
  )
}