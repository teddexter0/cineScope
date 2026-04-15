'use client'
// app/components/RatingModal.tsx
// Industry-standard 1–10 rating (same scale as TMDB/IMDb) with half-star feel.
// Shows as a compact slide-up sheet; parent controls open/close state.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'
import Image from 'next/image'

interface Props {
  movie: any
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, review: string) => void
  existingRating?: number
}

const LABELS: Record<number, string> = {
  1: 'Unwatchable',
  2: 'Very bad',
  3: 'Bad',
  4: 'Below average',
  5: 'Average',
  6: 'Decent',
  7: 'Good',
  8: 'Great',
  9: 'Excellent',
  10: 'Masterpiece',
}

const LABEL_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#fb923c',
  4: '#facc15', 5: '#a3e635', 6: '#4ade80',
  7: '#34d399', 8: '#22d3ee', 9: '#818cf8', 10: '#e879f9',
}

export default function RatingModal({ movie, isOpen, onClose, onSubmit, existingRating }: Props) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(existingRating || 0)
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelected(existingRating || 0)
      setHovered(0)
      setSubmitted(false)
    }
  }, [isOpen, existingRating])

  const active = hovered || selected
  const pct = active ? Math.round(active * 10) : 0

  const handleSubmit = () => {
    if (!selected) return
    onSubmit(selected, review)
    setSubmitted(true)
    setTimeout(onClose, 900)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(15,15,28,0.98) 0%, rgba(22,18,45,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Movie header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              {movie?.poster_path && (
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    width={40} height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em' }}>
                  {movie?.displayTitle || movie?.title || movie?.name}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  {movie?.release_date ? new Date(movie.release_date).getFullYear() : ''}
                  {movie?.media_type === 'tv' ? ' · Series' : ' · Film'}
                </p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-white/80 text-sm">Rated {selected}/10</p>
                </motion.div>
              ) : (
                <>
                  {/* Score display */}
                  <div className="text-center mb-5">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 8, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                      >
                        {active ? (
                          <>
                            <span
                              className="text-5xl font-black tabular-nums"
                              style={{ color: LABEL_COLORS[active], fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.04em' }}
                            >
                              {active}
                            </span>
                            <span className="text-white/30 text-xl font-light">/10</span>
                            <p className="text-xs mt-1 font-medium tracking-wide uppercase" style={{ color: LABEL_COLORS[active], opacity: 0.8 }}>
                              {LABELS[active]}
                            </p>
                          </>
                        ) : (
                          <p className="text-white/30 text-sm py-2">Tap a star to rate</p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Star row */}
                  <div className="flex justify-center gap-1 mb-5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <motion.button
                        key={n}
                        whileHover={{ scale: 1.25 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setSelected(n)}
                        className="transition-all duration-100"
                      >
                        <Star
                          className="w-6 h-6"
                          style={{
                            fill: n <= active ? (LABEL_COLORS[active] ?? '#facc15') : 'transparent',
                            stroke: n <= active ? (LABEL_COLORS[active] ?? '#facc15') : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.12s',
                          }}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {/* Percentage bar */}
                  <div className="mb-5">
                    <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: active ? LABEL_COLORS[active] : 'transparent' }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      />
                    </div>
                    {active > 0 && (
                      <p className="text-right text-white/30 text-xs mt-1">{pct}%</p>
                    )}
                  </div>

                  {/* Optional short review */}
                  <textarea
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    placeholder="Add a quick thought… (optional)"
                    maxLength={200}
                    rows={2}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: selected ? `linear-gradient(135deg, ${LABEL_COLORS[selected]}, ${LABEL_COLORS[Math.min(selected + 2, 10)]})` : 'rgba(255,255,255,0.1)',
                      color: selected ? '#0f0f1e' : 'rgba(255,255,255,0.3)',
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {selected ? `Submit ${selected}/10 rating` : 'Select a rating first'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}