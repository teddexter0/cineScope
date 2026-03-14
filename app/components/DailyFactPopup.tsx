'use client'
// app/components/DailyFactPopup.tsx
// Shows one unique film fact per user per day — never repeats until all 80 are cycled

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Film, Zap, Clock, Sparkles, Heart } from 'lucide-react'
import { getDailyFact, type CineFact } from '@/lib/daily-facts'

const CATEGORY_META: Record<CineFact['category'], { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  origin:      { icon: <Sparkles className="w-5 h-5" />, label: 'Origin Story',  color: 'text-yellow-300', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  courage:     { icon: <Heart className="w-5 h-5" />,    label: 'Courage',       color: 'text-pink-300',   bg: 'bg-pink-500/20 border-pink-500/40' },
  happenstance:{ icon: <Zap className="w-5 h-5" />,      label: 'Happenstance',  color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/40' },
  history:     { icon: <Clock className="w-5 h-5" />,    label: 'Film History',  color: 'text-blue-300',   bg: 'bg-blue-500/20 border-blue-500/40' },
  craft:       { icon: <Film className="w-5 h-5" />,     label: 'The Craft',     color: 'text-green-300',  bg: 'bg-green-500/20 border-green-500/40' },
}

interface Props {
  userEmail: string
}

export default function DailyFactPopup({ userEmail }: Props) {
  const [visible, setVisible] = useState(false)
  const [fact, setFact] = useState<CineFact | null>(null)

  useEffect(() => {
    if (!userEmail) return
    const { fact: dailyFact, isNew } = getDailyFact(userEmail)
    setFact(dailyFact)
    // Only pop up automatically if it's a new (today's) fact
    if (isNew) {
      const timer = setTimeout(() => setVisible(true), 1800)
      return () => clearTimeout(timer)
    }
  }, [userEmail])

  if (!fact) return null

  const meta = CATEGORY_META[fact.category]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setVisible(false) }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-white/20 rounded-2xl p-7 max-w-lg w-full shadow-2xl relative"
          >
            {/* Close */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Category badge */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mb-4 ${meta.bg} ${meta.color}`}>
              {meta.icon}
              {meta.label}
            </div>

            {/* Emoji + headline */}
            <div className="flex items-start gap-4 mb-4">
              <span className="text-5xl leading-none flex-shrink-0">{fact.emoji}</span>
              <h2 className="text-white font-bold text-xl leading-snug">{fact.headline}</h2>
            </div>

            {/* Body */}
            <p className="text-white/80 leading-relaxed text-sm mb-6">{fact.body}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className="text-white/30 text-xs">Your daily CineScope fact · new one tomorrow</p>
              <button
                onClick={() => setVisible(false)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all"
              >
                Got it ✓
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
