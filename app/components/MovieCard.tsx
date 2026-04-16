'use client'
// app/components/MovieCard.tsx

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Star } from 'lucide-react'
import RatingModal from './RatingModal'

interface Props {
  movie: any
  index: number
  onWatchlist: (movie: any) => void
  onRate: (movie: any, rating: number, review: string) => void
  existingRating?: number
}

const scoreColor = (s: number) => s >= 8 ? '#4ade80' : s >= 6 ? '#facc15' : s >= 4 ? '#fb923c' : '#f87171'

export default function MovieCard({ movie, index, onWatchlist, onRate, existingRating }: Props) {
  const [ratingOpen, setRatingOpen] = useState(false)
  const [hovered, setHovered]       = useState(false)

  const title    = movie.displayTitle || movie.title || movie.name || 'Untitled'
  const year     = movie.release_date ? new Date(movie.release_date).getFullYear() : ''
  const score    = movie.vote_average ?? 0
  const isTv     = movie.media_type === 'tv'
  const synopsis = movie.overview || ''
  const poster   = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: Math.min(index * 0.045, 0.5), ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex flex-col"
        data-movie-id={movie.id}
        style={{ fontFamily: "'DM Sans',sans-serif" }}
      >
        {/* ── Poster ── */}
        <div className="relative rounded-lg overflow-hidden"
          style={{
            aspectRatio: '2/3',
            boxShadow: hovered ? '0 18px 44px rgba(0,0,0,0.58)' : '0 4px 14px rgba(0,0,0,0.38)',
            transition: 'box-shadow 0.26s ease, transform 0.26s ease',
            transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          }}>

          {poster
            ? <Image src={poster} alt={title} fill className="object-cover"
                sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,16vw"
                style={{ transition: 'filter 0.26s', filter: hovered ? 'brightness(0.28)' : 'brightness(1)' }} />
            : <div className="w-full h-full flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>{isTv ? '📺' : '🎬'}</div>
          }

          {/* AI score */}
          {movie.aiScore && (
            <div className="absolute top-1.5 left-1.5 text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', color: '#facc15', border: '1px solid rgba(250,204,21,0.22)' }}>
              {Math.round(movie.aiScore)}
            </div>
          )}

          {/* Media type */}
          <div className="absolute top-1.5 right-1.5 text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ background: isTv ? 'rgba(99,102,241,0.82)' : 'rgba(15,15,30,0.72)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isTv ? 'TV' : 'Film'}
          </div>

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex flex-col justify-between p-2.5">

                {synopsis && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                    className="text-white/88 text-xs leading-relaxed line-clamp-6 flex-1"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {synopsis}
                  </motion.p>
                )}

                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="flex gap-1.5 mt-2 flex-shrink-0">
                  <button
                    onClick={() => setRatingOpen(true)}
                    {...(index === 0 ? { 'data-tour': 'like-btn' } : {})}
                    className="like-btn flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: existingRating ? 'rgba(250,204,21,0.88)' : 'rgba(255,255,255,0.13)', backdropFilter: 'blur(8px)', color: existingRating ? '#1a0f00' : '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>
                    <Star className="w-3 h-3 flex-shrink-0" style={{ fill: existingRating ? '#1a0f00' : 'none', stroke: 'currentColor' }} />
                    {existingRating ? `${existingRating}/10` : 'Rate'}
                  </button>

                  <button
                    onClick={() => onWatchlist(movie)}
                    {...(index === 0 ? { 'data-tour': 'watchlist-btn' } : {})}
                    className="watchlist-btn flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.13)' }}>
                    <Plus className="w-3 h-3 flex-shrink-0" />
                    Save
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Meta below poster ── */}
        <div className="mt-2 px-0.5">
          <h3 className="text-white font-medium text-xs md:text-sm leading-snug line-clamp-2"
            style={{ letterSpacing: '-0.01em' }}>{title}</h3>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-white/35 text-xs">{year}</span>
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" style={{ fill: scoreColor(score), stroke: 'none' }} />
              <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(score), fontSize: 11 }}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>
          {existingRating && (
            <div className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.18)', fontSize: 10 }}>
              <Star className="w-2 h-2" style={{ fill: '#facc15', stroke: 'none' }} />
              You: {existingRating}/10
            </div>
          )}
        </div>
      </motion.div>

      <RatingModal movie={movie} isOpen={ratingOpen} onClose={() => setRatingOpen(false)}
        onSubmit={(r, rev) => { onRate(movie, r, rev); setRatingOpen(false) }}
        existingRating={existingRating} />
    </>
  )
}
