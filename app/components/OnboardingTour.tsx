'use client'
// app/components/OnboardingTour.tsx
// Spotlight-style guided tour shown once per account (stored in localStorage).
// Uses getBoundingClientRect to position pointer arrows at real DOM elements.
// Each step has a target selector + message. Arrows animate in with framer-motion.

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles } from 'lucide-react'

interface TourStep {
  selector: string       // CSS selector for the element to point at
  title: string
  body: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="ai-recs"]',
    title: 'Your AI picks',
    body: 'These cards are personalised just for you. The score badge shows how well each title matches your taste profile.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="like-btn"]',
    title: 'Rate anything',
    body: 'Hit this button to give a 1–10 score. Your ratings sharpen the AI — the more you rate, the better it gets.',
    position: 'top',
  },
  {
    selector: '[data-tour="watchlist-btn"]',
    title: 'Save for later',
    body: 'Add titles to your watchlist and tick them off as you watch them. Access it any time from the menu.',
    position: 'top',
  },
  {
    selector: '[data-tour="refresh-ai"]',
    title: 'Refresh your feed',
    body: 'Bored of the current batch? Hit Refresh AI to generate a completely new set of recommendations.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="search-bar"]',
    title: 'Search everything',
    body: 'Search for any movie, series, actor, or director. You can add results straight to your watchlist or favourites.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="user-menu"]',
    title: 'Your profile',
    body: 'Access Watchlist, Ratings, Discover, Social, and AI retraining from here. Welcome to CineScope!',
    position: 'bottom',
  },
]

const STORAGE_KEY = 'cinescope_tour_done_v1'

interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height }
}

function ArrowPointer({ rect, position }: { rect: Rect; position: TourStep['position'] }) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  // Small pulsing ring around the target element
  return (
    <>
      {/* Pulsing highlight ring */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          borderRadius: 10,
          border: '2px solid rgba(250,204,21,0.8)',
          boxShadow: '0 0 0 4px rgba(250,204,21,0.15)',
        }}
        animate={{ boxShadow: ['0 0 0 4px rgba(250,204,21,0.15)', '0 0 0 10px rgba(250,204,21,0)', '0 0 0 4px rgba(250,204,21,0.15)'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Arrow line */}
      {position === 'bottom' && (
        <motion.div
          className="absolute pointer-events-none"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          style={{
            top: rect.top + rect.height + 8,
            left: cx - 1,
            width: 2,
            height: 24,
            background: 'rgba(250,204,21,0.7)',
            transformOrigin: 'top',
          }}
        />
      )}
      {position === 'top' && (
        <motion.div
          className="absolute pointer-events-none"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          style={{
            top: rect.top - 32,
            left: cx - 1,
            width: 2,
            height: 24,
            background: 'rgba(250,204,21,0.7)',
            transformOrigin: 'bottom',
          }}
        />
      )}
    </>
  )
}

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })

  const current = TOUR_STEPS[step]

  const measureStep = useCallback((s: number) => {
    const r = getRect(TOUR_STEPS[s].selector)
    if (!r) return
    setRect(r)

    const TOOLTIP_W = 280
    const TOOLTIP_H = 130
    const cx = r.left + r.width / 2
    const pos = TOUR_STEPS[s].position

    let top = 0, left = 0

    if (pos === 'bottom') {
      top = r.top + r.height + 36
      left = Math.max(16, Math.min(cx - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 16))
    } else if (pos === 'top') {
      top = r.top - TOOLTIP_H - 36
      left = Math.max(16, Math.min(cx - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 16))
    } else if (pos === 'right') {
      top = r.top + r.height / 2 - TOOLTIP_H / 2
      left = r.left + r.width + 20
    } else {
      top = r.top + r.height / 2 - TOOLTIP_H / 2
      left = r.left - TOOLTIP_W - 20
    }

    setTooltipPos({ top, left })
  }, [])

  useEffect(() => {
    // Show tour only once per device/browser
    const done = localStorage.getItem(STORAGE_KEY)
    if (done) return

    // Wait for the dashboard to fully render before measuring elements
    const t = setTimeout(() => {
      const firstEl = document.querySelector(TOUR_STEPS[0].selector)
      if (firstEl) {
        setStep(0)
        measureStep(0)
        setVisible(true)
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [measureStep])

  useEffect(() => {
    if (!visible) return
    measureStep(step)
    // Re-measure on resize
    const handler = () => measureStep(step)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [step, visible, measureStep])

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finish()
    }
  }

  const finish = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!visible || !rect) return null

  return (
    <>
      {/* Dark overlay with cut-out around the target */}
      <div
        className="fixed inset-0 z-[55] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />

      {/* Pointer arrows rendered absolutely over the overlay */}
      <div className="fixed inset-0 z-[56] pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowPointer rect={rect} position={current.position} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="fixed z-[58] pointer-events-auto"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: 280,
          }}
        >
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(160deg, rgba(12,10,26,0.98) 0%, rgba(20,16,40,0.98) 100%)',
              border: '1px solid rgba(250,204,21,0.25)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(250,204,21,0.08)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-3">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 16 : 5,
                    height: 5,
                    background: i === step ? '#facc15' : i < step ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
              <button onClick={finish} className="ml-auto text-white/25 hover:text-white/50 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs font-semibold uppercase tracking-widest">
                {step + 1} of {TOUR_STEPS.length}
              </p>
            </div>

            <h3 className="text-white font-semibold text-base mb-1.5" style={{ letterSpacing: '-0.02em' }}>
              {current.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              {current.body}
            </p>

            <button
              onClick={next}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #facc15, #f97316)',
                color: '#0f0f1e',
                letterSpacing: '-0.01em',
              }}
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>Next <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Let me explore ✓</>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}