'use client'
// app/components/MovieCard.tsx
// Drop-in replacement for the inline movie card in dashboard/page.tsx.
// Handles its own rating modal state. Parent passes onWatchlist + onRate callbacks.
//
// Typography: DM Sans (loaded via @import in globals.css — add the line below)
// Animations: framer-motion spring + CSS hover transitions. Subtle, not distracting.

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Star, Play } from 'lucide-react'
import RatingModal from './RatingModal'

interface Props {
  movie: any
  index: number
  onWatchlist: (movie: any) => void
  onRate: (movie: any, rating: number, review: string) => void
  existingRating?: number
}

// Score badge colour — matches TMDB visual language
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
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex flex-col"
        data-movie-id={movie.id}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* --- Poster --- */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            aspectRatio: '2/3',
            boxShadow: hovered
              ? '0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)'
              : '0 6px 20px rgba(0,0,0,0.35)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
          }}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 16vw"
              style={{ transition: 'filter 0.3s ease', filter: hovered ? 'brightness(0.7)' : 'brightness(1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
              {isTv ? '📺' : '🎬'}
            </div>
          )}

          {/* AI score badge — top left */}
          {movie.aiScore && (
            <div
              className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                color: '#facc15',
                letterSpacing: '0.02em',
                border: '1px solid rgba(250,204,21,0.3)',
              }}
            >
              AI {Math.round(movie.aiScore)}
            </div>
          )}

          {/* Media type pill — top right */}
          <div
            className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isTv ? 'rgba(99,102,241,0.85)' : 'rgba(30,30,50,0.75)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {isTv ? 'Series' : 'Film'}
          </div>

          {/* Hover overlay with action buttons */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Rate button — opens modal */}
            <button
              onClick={() => setRatingOpen(true)}
              {...(index === 0 ? { 'data-tour': 'like-btn' } : {})}
              className="like-btn w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: existingRating
                  ? 'rgba(250,204,21,0.9)'
                  : 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: existingRating ? '#0f0f1e' : '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Star className="w-3.5 h-3.5" style={{ fill: existingRating ? '#0f0f1e' : 'none' }} />
              {existingRating ? `${existingRating}/10` : 'Rate'}
            </button>

            {/* Watchlist button */}
            <button
              onClick={() => onWatchlist(movie)}
              {...(index === 0 ? { 'data-tour': 'watchlist-btn' } : {})}
              className="watchlist-btn w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Watchlist
            </button>
          </motion.div>
        </div>

        {/* --- Info below poster --- */}
        <div className="mt-2.5 px-0.5">
          {/* Title */}
          <h3
            className="text-white font-semibold text-sm leading-snug line-clamp-2"
            style={{ letterSpacing: '-0.015em' }}
          >
            {title}
          </h3>

          {/* Year + score row */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/40 text-xs">{year}</span>
            <div className="flex items-center gap-1">
              <Star
                className="w-3 h-3"
                style={{ fill: scoreColor(score), stroke: 'none' }}
              />
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: scoreColor(score) }}
              >
                {score.toFixed(1)}
              </span>
            </div>
          </div>

          {/* If rated, show user's own score */}
          {existingRating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5"
            >
              <div
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}
              >
                <Star className="w-2.5 h-2.5" style={{ fill: '#facc15', stroke: 'none' }} />
                Your rating: {existingRating}/10
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Rating modal */}
      <RatingModal
        movie={movie}
        isOpen={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={(rating, review) => {
          onRate(movie, rating, review)
          setRatingOpen(false)
        }}
        existingRating={existingRating}
      />
    </>
  )
}