'use client'
// app/components/OnboardingTour.tsx

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles } from 'lucide-react'

interface Step { selector: string; title: string; body: string; position: 'top'|'bottom'|'left'|'right' }
interface Props { onReady?: () => void }
interface Rect  { top: number; left: number; width: number; height: number }

const STEPS: Step[] = [
  { selector:'[data-tour="ai-recs"]',      title:'Your AI picks',     body:'Cards personalised for you. Hover any poster to read the synopsis, then rate or save it.',                           position:'bottom' },
  { selector:'[data-tour="like-btn"]',     title:'Rate with stars',   body:'Give any title a 1–10 score. The more you rate, the sharper your recommendations get.',                             position:'top'    },
  { selector:'[data-tour="watchlist-btn"]',title:'Save for later',    body:'Add to your watchlist and tick titles off as you watch them.',                                                       position:'top'    },
  { selector:'[data-tour="refresh-ai"]',   title:'Refresh your feed', body:'Generate a completely fresh batch of AI recommendations any time.',                                                  position:'bottom' },
  { selector:'[data-tour="search-bar"]',   title:'Search everything', body:'Find any movie, series, actor or director. Drop results straight into your watchlist.',                             position:'bottom' },
  { selector:'[data-tour="user-menu"]',    title:'Your menu',         body:'Access Watchlist, Ratings, Discover, Social and AI retraining from here. Welcome to CineScope!',                   position:'bottom' },
]

const KEY = 'cinescope_tour_done_v1'

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
  const [tip, setTip]         = useState({ top: 0, left: 0 })

  const measure = useCallback((s: number) => {
    const r = getRect(STEPS[s].selector)
    if (!r) return
    setRect(r)
    const W = 272, H = 152, cx = r.left + r.width / 2
    const pos = STEPS[s].position
    let top = 0, left = 0
    if      (pos === 'bottom') { top = r.top + r.height + 36; left = Math.max(12, Math.min(cx - W/2, window.innerWidth - W - 12)) }
    else if (pos === 'top')    { top = r.top - H - 36;        left = Math.max(12, Math.min(cx - W/2, window.innerWidth - W - 12)) }
    else if (pos === 'right')  { top = r.top + r.height/2 - H/2; left = r.left + r.width + 16 }
    else                       { top = r.top + r.height/2 - H/2; left = r.left - W - 16 }
    setTip({ top, left })
  }, [])

  useEffect(() => {
    if (localStorage.getItem(KEY)) { onReady?.(); return }
    const t = setTimeout(() => {
      if (document.querySelector(STEPS[0].selector)) { setStep(0); measure(0); setVisible(true) }
    }, 1600)
    return () => clearTimeout(t)
  }, [measure, onReady]) // eslint-disable-line

  useEffect(() => {
    if (!visible) return
    measure(step)
    const h = () => measure(step)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [step, visible, measure])

  const finish = () => {
    setVisible(false)
    localStorage.setItem(KEY, 'true')
    onReady?.()
  }

  const next = () => step < STEPS.length - 1 ? (setStep(s => s + 1)) : finish()

  if (!visible || !rect) return null

  const cur = STEPS[step]

  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none" style={{ background:'rgba(0,0,0,0.5)' }} />

      <div className="fixed inset-0 z-[56] pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {/* Highlight ring */}
            <motion.div className="absolute pointer-events-none"
              style={{ top:rect.top-5, left:rect.left-5, width:rect.width+10, height:rect.height+10, borderRadius:10, border:'2px solid rgba(250,204,21,0.82)' }}
              animate={{ boxShadow:['0 0 0 4px rgba(250,204,21,0.12)','0 0 0 12px rgba(250,204,21,0)','0 0 0 4px rgba(250,204,21,0.12)'] }}
              transition={{ duration:1.5, repeat:Infinity }} />
            {/* Stem */}
            {cur.position === 'bottom' && (
              <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }} className="absolute pointer-events-none"
                style={{ top:rect.top+rect.height+8, left:rect.left+rect.width/2-1, width:2, height:20, background:'rgba(250,204,21,0.62)', transformOrigin:'top' }} />
            )}
            {cur.position === 'top' && (
              <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }} className="absolute pointer-events-none"
                style={{ top:rect.top-28, left:rect.left+rect.width/2-1, width:2, height:20, background:'rgba(250,204,21,0.62)', transformOrigin:'bottom' }} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity:0, y:6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-6, scale:0.97 }}
          transition={{ type:'spring', stiffness:360, damping:28 }}
          className="fixed z-[58] pointer-events-auto"
          style={{ top:tip.top, left:tip.left, width:272, fontFamily:"'DM Sans',sans-serif" }}>
          <div className="rounded-xl p-4"
            style={{ background:'rgba(10,8,22,0.98)', border:'1px solid rgba(250,204,21,0.2)', boxShadow:'0 24px 60px rgba(0,0,0,0.55)' }}>
            {/* Dots */}
            <div className="flex items-center gap-1.5 mb-3">
              {STEPS.map((_,i) => (
                <div key={i} className="rounded transition-all duration-300"
                  style={{ width:i===step?16:5, height:5, background:i===step?'#facc15':i<step?'rgba(250,204,21,0.32)':'rgba(255,255,255,0.1)' }} />
              ))}
              <button onClick={finish} className="ml-auto text-white/22 hover:text-white/55 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400/65 text-xs font-medium uppercase tracking-widest">{step+1} / {STEPS.length}</span>
            </div>
            <h3 className="text-white font-semibold text-base mb-1.5" style={{ letterSpacing:'-0.02em' }}>{cur.title}</h3>
            <p className="text-white/52 text-sm leading-relaxed mb-4">{cur.body}</p>
            <button onClick={next}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-108 active:scale-[0.98] transition-all"
              style={{ background:'linear-gradient(135deg,#facc15,#f97316)', color:'#1a0f00', letterSpacing:'-0.01em' }}>
              {step < STEPS.length-1 ? <><span>Next</span><ChevronRight className="w-4 h-4" /></> : 'Let me explore ✓'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}