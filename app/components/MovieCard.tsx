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

function scoreColor(score: number) {
  if (score >= 8) return '#4ade80'
  if (score >= 6) return '#facc15'
  if (score >= 4) return '#fb923c'
  return '#f87171'
}

export default function MovieCard({ movie, index, onWatchlist, onRate, existingRating }: Props) {
  const [ratingOpen, setRatingOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const title = movie.displayTitle || movie.title || movie.name || 'Untitled'
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : ''
  const score = movie.vote_average ?? 0
  const isTv = movie.media_type === 'tv'
  const synopsis = movie.overview || ''
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex flex-col"
        data-movie-id={movie.id}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Poster ── */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            aspectRatio: '2/3',
            boxShadow: hovered
              ? '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 4px 16px rgba(0,0,0,0.4)',
            transition: 'box-shadow 0.28s ease, transform 0.28s ease',
            transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          }}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 16vw"
              style={{
                transition: 'filter 0.28s ease',
                filter: hovered ? 'brightness(0.3)' : 'brightness(1)',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
              {isTv ? '📺' : '🎬'}
            </div>
          )}

          {/* AI score badge */}
          {movie.aiScore && (
            <div className="absolute top-2 left-2 text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
                color: '#facc15', border: '1px solid rgba(250,204,21,0.25)',
              }}>
              {Math.round(movie.aiScore)}
            </div>
          )}

          {/* Media type */}
          <div className="absolute top-2 right-2 text-xs font-medium px-1.5 py-0.5 rounded"
            style={{
              background: isTv ? 'rgba(99,102,241,0.82)' : 'rgba(20,20,40,0.72)',
              backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
            {isTv ? 'TV' : 'Film'}
          </div>

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="absolute inset-0 flex flex-col justify-between p-3"
              >
                {/* Synopsis */}
                {synopsis && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-white/90 text-xs leading-relaxed line-clamp-6 flex-1"
                  >
                    {synopsis}
                  </motion.p>
                )}

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.09 }}
                  className="flex gap-1.5 mt-2 flex-shrink-0"
                >
                  <button
                    onClick={() => setRatingOpen(true)}
                    {...(index === 0 ? { 'data-tour': 'like-btn' } : {})}
                    className="like-btn flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{
                      background: existingRating ? 'rgba(250,204,21,0.9)' : 'rgba(255,255,255,0.14)',
                      backdropFilter: 'blur(8px)',
                      color: existingRating ? '#0f0f1e' : '#fff',
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}
                  >
                    <Star className="w-3 h-3 flex-shrink-0"
                      style={{ fill: existingRating ? '#0f0f1e' : 'none', stroke: 'currentColor' }} />
                    {existingRating ? `${existingRating}/10` : 'Rate'}
                  </button>

                  <button
                    onClick={() => onWatchlist(movie)}
                    {...(index === 0 ? { 'data-tour': 'watchlist-btn' } : {})}
                    className="watchlist-btn flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.11)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <Plus className="w-3 h-3 flex-shrink-0" />
                    Save
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Below poster ── */}
        <div className="mt-2 px-0.5">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2"
            style={{ letterSpacing: '-0.015em' }}>
            {title}
          </h3>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-white/38 text-xs">{year}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ fill: scoreColor(score), stroke: 'none' }} />
              <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(score) }}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>

          {existingRating && (
            <div className="mt-1 flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded w-fit"
              style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}>
              <Star className="w-2.5 h-2.5" style={{ fill: '#facc15', stroke: 'none' }} />
              You: {existingRating}/10
            </div>
          )}
        </div>
      </motion.div>

      <RatingModal
        movie={movie}
        isOpen={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={(rating, review) => { onRate(movie, rating, review); setRatingOpen(false) }}
        existingRating={existingRating}
      />
    </>
  )
}