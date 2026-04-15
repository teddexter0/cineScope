'use client'
// app/components/OnboardingTour.tsx

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles } from 'lucide-react'

interface TourStep {
  selector: string
  title: string
  body: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="ai-recs"]',
    title: 'Your AI picks',
    body: 'Cards personalised for you. Hover any poster to read the synopsis, rate it 1–10, or save it.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="like-btn"]',
    title: 'Rate with stars',
    body: 'Give any title a 1–10 score. The more you rate, the sharper your recommendations get.',
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
    body: 'Generate a completely fresh set of AI recommendations any time.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="search-bar"]',
    title: 'Search everything',
    body: 'Find any movie, series, actor, or director. Results can go straight to your watchlist.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="user-menu"]',
    title: 'Your menu',
    body: 'Access Watchlist, Ratings, Discover, Social, and AI retraining from here.',
    position: 'bottom',
  },
]

const STORAGE_KEY = 'cinescope_tour_done_v1'

interface Rect { top: number; left: number; width: number; height: number }

interface Props {
  /** Called once the tour has been shown (or skipped) so the parent can show a "Replay" button */
  onReady?: () => void
}

function getRect(sel: string): Rect | null {
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height }
}

export default function OnboardingTour({ onReady }: Props) {
  const [visible, setVisible] = useState(false)
  const [step, setStep]       = useState(0)
  const [rect, setRect]       = useState<Rect | null>(null)
  const [tipPos, setTipPos]   = useState({ top: 0, left: 0 })

  const current = STEPS[step]

  const measure = useCallback((s: number) => {
    const r = getRect(STEPS[s].selector)
    if (!r) return
    setRect(r)
    const W = 276, H = 150
    const cx = r.left + r.width / 2
    const pos = STEPS[s].position
    let top = 0, left = 0
    if (pos === 'bottom')      { top = r.top + r.height + 38; left = Math.max(12, Math.min(cx - W / 2, window.innerWidth - W - 12)) }
    else if (pos === 'top')    { top = r.top - H - 38;        left = Math.max(12, Math.min(cx - W / 2, window.innerWidth - W - 12)) }
    else if (pos === 'right')  { top = r.top + r.height / 2 - H / 2; left = r.left + r.width + 18 }
    else                       { top = r.top + r.height / 2 - H / 2; left = r.left - W - 18 }
    setTipPos({ top, left })
  }, [])

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) { onReady?.(); return }
    const t = setTimeout(() => {
      if (document.querySelector(STEPS[0].selector)) {
        setStep(0); measure(0); setVisible(true)
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [measure, onReady])

  useEffect(() => {
    if (!visible) return
    measure(step)
    const h = () => measure(step)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [step, visible, measure])

  const finish = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
    onReady?.()
  }

  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()

  if (!visible || !rect) return null

  return (
    <>
      {/* Dim overlay */}
      <div className="fixed inset-0 z-[55] pointer-events-none" style={{ background: 'rgba(0,0,0,0.52)' }} />

      {/* Highlight ring + arrow */}
      <div className="fixed inset-0 z-[56] pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Ring */}
            <motion.div className="absolute pointer-events-none" style={{
              top: rect.top - 6, left: rect.left - 6,
              width: rect.width + 12, height: rect.height + 12,
              borderRadius: 10, border: '2px solid rgba(250,204,21,0.85)',
            }}
              animate={{ boxShadow: ['0 0 0 4px rgba(250,204,21,0.12)', '0 0 0 12px rgba(250,204,21,0)', '0 0 0 4px rgba(250,204,21,0.12)'] }}
              transition={{ duration: 1.5, repeat: Infinity }} />

            {/* Stem line */}
            {current.position === 'bottom' && (
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                className="absolute pointer-events-none"
                style={{ top: rect.top + rect.height + 8, left: rect.left + rect.width / 2 - 1, width: 2, height: 22, background: 'rgba(250,204,21,0.65)', transformOrigin: 'top' }} />
            )}
            {current.position === 'top' && (
              <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                className="absolute pointer-events-none"
                style={{ top: rect.top - 30, left: rect.left + rect.width / 2 - 1, width: 2, height: 22, background: 'rgba(250,204,21,0.65)', transformOrigin: 'bottom' }} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="fixed z-[58] pointer-events-auto"
          style={{ top: tipPos.top, left: tipPos.left, width: 276, fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="rounded-xl p-4"
            style={{
              background: 'rgba(10,8,22,0.97)',
              border: '1px solid rgba(250,204,21,0.22)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}>
            {/* Progress */}
            <div className="flex items-center gap-1.5 mb-3">
              {STEPS.map((_, i) => (
                <div key={i} className="rounded transition-all duration-300"
                  style={{ width: i === step ? 16 : 5, height: 5,
                    background: i === step ? '#facc15' : i < step ? 'rgba(250,204,21,0.35)' : 'rgba(255,255,255,0.12)' }} />
              ))}
              <button onClick={finish} className="ml-auto text-white/25 hover:text-white/55 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400/70 text-xs font-medium uppercase tracking-widest">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            <h3 className="text-white font-semibold text-base mb-1.5" style={{ letterSpacing: '-0.02em' }}>
              {current.title}
            </h3>
            <p className="text-white/55 text-sm leading-relaxed mb-4">{current.body}</p>

            <button onClick={next}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#facc15,#f97316)', color: '#1a0f00', letterSpacing: '-0.01em' }}>
              {step < STEPS.length - 1 ? <><span>Next</span><ChevronRight className="w-4 h-4" /></> : 'Let me explore ✓'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}