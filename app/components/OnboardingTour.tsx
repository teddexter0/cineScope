'use client'
// app/components/OnboardingTour.tsx
// Fixes:
// 1. Stem arrow was drawing across the page because it was positioned inside a relative ancestor.
// 2. Tour elements now use viewport-relative fixed positioning.
// 3. onReady still fires when the tour was already completed so replay can stay available.

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles } from 'lucide-react'

interface Step {
  selector: string
  title: string
  body: string
  position: 'top' | 'bottom' | 'left' | 'right'
  targetMaxWidth?: number
  targetMaxHeight?: number
  offsetX?: number
  offsetY?: number
}

interface Props {
  onReady?: () => void
  onFinish?: () => void
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="ai-recs"]',
    title: 'Your AI picks',
    body: 'Cards personalised for you. Hover any poster to read the synopsis, then rate or save it.',
    position: 'bottom',
    targetMaxWidth: 220,
    targetMaxHeight: 68,
    offsetX: -48,
  },
  {
    selector: '[data-tour="like-btn"]',
    title: 'Rate with stars',
    body: 'Give any title a 1-10 score. The more you rate, the sharper your recommendations get.',
    position: 'top',
  },
  {
    selector: '[data-tour="watchlist-btn"]',
    title: 'Save for later',
    body: 'Add to your watchlist and tick titles off as you watch them.',
    position: 'top',
  },
  {
    selector: '[data-tour="refresh-ai"]',
    title: 'Refresh your feed',
    body: 'Generate a completely fresh batch of AI recommendations any time.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="search-bar"]',
    title: 'Search everything',
    body: 'Find any movie, series, actor or director. Drop results straight into your watchlist.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="user-menu"]',
    title: 'Your menu',
    body: 'Access Watchlist, Ratings, Discover, Social and AI retraining from here.',
    position: 'bottom',
  },
]

const KEY = 'cinescope_tour_done_v1'
const TARGET_MAX_WIDTH = 320
const TARGET_MAX_HEIGHT = 140

function getViewportRect(step: Step): Rect | null {
  const selector = step.selector
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const width = Math.min(r.width, step.targetMaxWidth ?? TARGET_MAX_WIDTH)
  const height = Math.min(r.height, step.targetMaxHeight ?? TARGET_MAX_HEIGHT)
  const left = r.left + (r.width - width) / 2 + (step.offsetX ?? 0)
  const top = r.top + (r.height - height) / 2 + (step.offsetY ?? 0)
  return { top, left, width, height }
}

export default function OnboardingTour({ onReady, onFinish }: Props) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tip, setTip] = useState({ top: 0, left: 0 })

  const cur = STEPS[step]

  const measure = useCallback((s: number) => {
    const stepConfig = STEPS[s]
    const r = getViewportRect(stepConfig)
    if (!r) return
    setRect(r)

    const width = 272
    const centerX = r.left + r.width / 2
    const pos = stepConfig.position
    let top = 0
    let left = 0

    if (pos === 'bottom') {
      top = r.top + r.height + 38
      left = Math.max(12, Math.min(centerX - width / 2, window.innerWidth - width - 12))
    } else if (pos === 'top') {
      top = r.top - 170
      left = Math.max(12, Math.min(centerX - width / 2, window.innerWidth - width - 12))
    } else if (pos === 'right') {
      top = r.top + r.height / 2 - 76
      left = r.left + r.width + 16
    } else {
      top = r.top + r.height / 2 - 76
      left = r.left - width - 16
    }

    setTip({ top, left })
  }, [])

  useEffect(() => {
    if (localStorage.getItem(KEY)) {
      onReady?.()
      return
    }

    const t = setTimeout(() => {
      if (document.querySelector(STEPS[0].selector)) {
        setStep(0)
        measure(0)
        setVisible(true)
      }
    }, 1400)

    return () => clearTimeout(t)
  }, [measure, onReady])

  useEffect(() => {
    if (!visible) return

    measure(step)
    const handleMeasure = () => measure(step)
    window.addEventListener('resize', handleMeasure, { passive: true })
    window.addEventListener('scroll', handleMeasure, { passive: true })

    return () => {
      window.removeEventListener('resize', handleMeasure)
      window.removeEventListener('scroll', handleMeasure)
    }
  }, [step, visible, measure])

  const finish = () => {
    setVisible(false)
    localStorage.setItem(KEY, 'true')
    onReady?.()
    onFinish?.()
  }

  const next = () => (
    step < STEPS.length - 1
      ? setStep(current => current + 1)
      : finish()
  )

  if (!visible || !rect) return null

  const stemX = rect.left + rect.width / 2

  return (
    <>
      <div
        className="fixed inset-0 z-[200] pointer-events-auto"
        style={{ background: 'rgba(0,0,0,0.52)' }}
      />

      <motion.div
        key={`ring-${step}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed pointer-events-none z-[201]"
        style={{
          top: rect.top - 5,
          left: rect.left - 5,
          width: rect.width + 10,
          height: rect.height + 10,
          borderRadius: 10,
          border: '2px solid rgba(250,204,21,0.85)',
          boxShadow: '0 0 0 4px rgba(250,204,21,0.12)',
        }}
      />

      {cur.position === 'bottom' && (
        <motion.div
          key={`stem-${step}`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className="fixed pointer-events-none z-[201]"
          style={{
            top: rect.top + rect.height + 5,
            left: stemX - 1,
            width: 2,
            height: 26,
            background: 'rgba(250,204,21,0.65)',
            transformOrigin: 'top',
          }}
        />
      )}

      {cur.position === 'top' && (
        <motion.div
          key={`stem-${step}`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className="fixed pointer-events-none z-[201]"
          style={{
            top: rect.top - 31,
            left: stemX - 1,
            width: 2,
            height: 26,
            background: 'rgba(250,204,21,0.65)',
            transformOrigin: 'bottom',
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="fixed z-[202] pointer-events-auto"
          style={{
            top: tip.top,
            left: tip.left,
            width: 272,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(10,8,22,0.98)',
              border: '1px solid rgba(250,204,21,0.22)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded transition-all duration-300"
                  style={{
                    width: i === step ? 16 : 5,
                    height: 5,
                    background:
                      i === step
                        ? '#facc15'
                        : i < step
                          ? 'rgba(250,204,21,0.35)'
                          : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
              <button
                onClick={finish}
                className="ml-auto text-white/25 hover:text-white/55 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400/65 text-xs font-medium uppercase tracking-widest">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            <h3
              className="text-white font-semibold text-base mb-1.5"
              style={{ letterSpacing: '-0.02em' }}
            >
              {cur.title}
            </h3>
            <p className="text-white/52 text-sm leading-relaxed mb-4">{cur.body}</p>

            <button
              onClick={next}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#facc15,#f97316)',
                color: '#1a0f00',
                letterSpacing: '-0.01em',
              }}
            >
              {step < STEPS.length - 1 ? (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Let me explore ✓'
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
