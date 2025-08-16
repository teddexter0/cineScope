// Replace your entire app/page.tsx with this FIXED version:

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
  Star
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

  // Replace your page return statement with this styled version:

return (
  <>
    {/* 🎬 YOUTUBE TRAILERS BACKGROUND */}
    <div className="youtube-background">
      <YouTubeTrailerBackground 
        autoplay={true}
        muted={true}
        showControls={false}
        loop={true}
        className="w-full h-full"
      />
    </div>

    {/* MAIN CONTENT OVERLAY */}
    <div className="content-overlay">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">
              <span style={{ fontSize: '1.25rem' }}>🎬</span>
            </div>
            <h1 className="logo-text">CineScope</h1>
          </div>
          
          <nav className="nav-container">
            {session ? (
              <>
                <a href="/dashboard" className="nav-link">Dashboard</a>
                <button onClick={handleSignOut} className="nav-link">Sign Out</button>
              </>
            ) : (
              <>
                <a href="/auth/signin" className="nav-link">Sign In</a>
                <a href="/auth/signup" className="nav-button">Get Started</a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          
          {/* Badge */}
          <div className="hero-badge">
            <span>✨</span>
            <span>AI-Powered Movie Discovery</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="hero-title">
            Never Wonder
            <br />
            <span className="hero-highlight">
              What to Watch
            </span>
            <br />
            Again
          </h1>
          
          {/* Description */}
          <div className="hero-description">
            <p>
              CineScope uses advanced AI to understand your unique taste and deliver movie recommendations 
              so perfect, you'll feel like we're reading your mind.
            </p>
          </div>

          {/* Buttons */}
          <div className="cta-container">
            {session ? (
              <a href="/dashboard" className="cta-primary">
                Go to Dashboard
                <span>→</span>
              </a>
            ) : (
              <>
                <a href="/auth/signup" className="cta-primary">
                  Get Started Free
                  <span>→</span>
                </a>
                <a href="#how-it-works" className="cta-secondary">
                  <span>🧠</span>
                  See How It Works
                </a>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number stat-yellow">97%</div>
              <div className="stat-label">AI Match Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-number stat-orange">2M+</div>
              <div className="stat-label">Movies Analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number stat-yellow">10s</div>
              <div className="stat-label">To Perfect Match</div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', background: 'rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          
          <h2 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: 'white', 
            marginBottom: '3rem',
            textShadow: '0 0 4px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)'
          }}>
            How CineScope AI Works
          </h2>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginBottom: '4rem',
            maxWidth: '800px',
            margin: '0 auto 4rem auto'
          }}>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'white', 
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              margin: 0
            }}>
              Our advanced AI analyzes your personality and movie preferences to deliver recommendations that feel like magic.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
          }}>
            {/* Step 1 */}
            <div className="stat-card">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                background: 'linear-gradient(45deg, #facc15, #f97316)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <span style={{ fontSize: '2rem' }}>🧠</span>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'white', 
                marginBottom: '1rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                1. Personality Analysis
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                margin: 0
              }}>
                Our AI analyzes your responses to understand your unique movie personality and preferences.
              </p>
            </div>

            {/* Step 2 */}
            <div className="stat-card">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                background: 'linear-gradient(45deg, #facc15, #f97316)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <span style={{ fontSize: '2rem' }}>⚡</span>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'white', 
                marginBottom: '1rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                2. Smart Matching
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                margin: 0
              }}>
                We match your profile against millions of movies to find perfect matches for your taste.
              </p>
            </div>

            {/* Step 3 */}
            <div className="stat-card">
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                background: 'linear-gradient(45deg, #facc15, #f97316)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <span style={{ fontSize: '2rem' }}>⭐</span>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'white', 
                marginBottom: '1rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                3. Perfect Recommendations
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                margin: 0
              }}>
                Get personalized movie suggestions that match your mood, time, and viewing preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 1.5rem 8rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="stat-card">
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: 'white', 
              marginBottom: '1.5rem',
              textShadow: '0 0 4px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)'
            }}>
              Ready to Discover Your Next Favorite Movie?
            </h2>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'white', 
              marginBottom: '2rem',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              Join thousands of movie lovers who never wonder what to watch again.
            </p>
            <a href="/auth/signup" className="cta-primary">
              Start Your AI Journey
              <span>✨</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  </>
)
}