'use client'
// app/ratings/page.tsx — with editable ratings

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Calendar, ArrowLeft, Film, Pencil } from 'lucide-react'
import { persistentStorage } from '@/lib/persistent-storage'
import RatingModal from '@/app/components/RatingModal'

export default function RatingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [ratings, setRatings] = useState<any[]>([])
  const [editTarget, setEditTarget] = useState<any | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status === 'authenticated') loadRatings()
  }, [status, router])

  const loadRatings = async () => {
    try {
      const userEmail = session?.user?.email || 'demo@user.com'
      const stored = persistentStorage.getRatings(userEmail)
      setRatings(stored)
      // Background server sync
      try {
        const res = await fetch('/api/movies/rate')
        const data = await res.json()
        if (data.success && data.ratings?.length > 0) {
          const merged = [...stored]
          data.ratings.forEach((s: any) => {
            if (!merged.find(l => l.movieId === s.movieId)) merged.push(s)
          })
          if (merged.length > stored.length) {
            persistentStorage.setRatings(userEmail, merged)
            setRatings(merged)
          }
        }
      } catch {}
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleEditSubmit = async (rating: number, review: string) => {
    if (!editTarget) return
    const userEmail = session?.user?.email || 'demo@user.com'
    const updated = {
      ...editTarget,
      rating,
      review,
      updatedAt: new Date().toISOString(),
    }
    persistentStorage.addRating(userEmail, updated)
    setRatings(persistentStorage.getRatings(userEmail))
    // Sync server
    try {
      await fetch('/api/movies/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, movieId: editTarget.movieId }),
      })
    } catch {}
    setEditTarget(null)
  }

  const getPosterUrl = (p: string | null) =>
    p ? `https://image.tmdb.org/t/p/w500${p}` : ''

  const COLORS: Record<number, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#fb923c', 4: '#facc15', 5: '#a3e635',
    6: '#4ade80', 7: '#34d399', 8: '#22d3ee', 9: '#818cf8', 10: '#e879f9',
  }

  if (status === 'loading' || isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 border-4 border-purple-400 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors mb-6 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/14 border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
            My Ratings
          </h1>
          <p className="text-white/45 text-sm">
            {ratings.length} {ratings.length === 1 ? 'title' : 'titles'} rated
          </p>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded-xl p-10 border border-white/10 bg-white/6 text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-white mb-3">No ratings yet</h2>
            <p className="text-white/50 text-sm mb-5">Rate movies from your dashboard to see them here.</p>
            <button onClick={() => router.push('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratings.map((r, i) => (
              <motion.div key={r.id || i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl overflow-hidden border border-white/10 bg-white/6 hover:bg-white/9 transition-colors"
              >
                <div className="flex gap-3 p-4">
                  {/* Poster */}
                  <div className="w-16 h-22 flex-shrink-0 rounded-lg overflow-hidden bg-white/8">
                    {r.poster_path ? (
                      <Image src={getPosterUrl(r.poster_path)} alt={r.title || 'Movie'}
                        width={64} height={88} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1"
                      style={{ letterSpacing: '-0.01em' }}>
                      {r.title || 'Unknown'}
                      {r.media_type === 'tv' && (
                        <span className="text-blue-400 font-normal ml-1 text-xs">Series</span>
                      )}
                    </h3>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 10 }, (_, idx) => (
                          <Star key={idx} className="w-2.5 h-2.5"
                            style={{
                              fill: idx < (r.rating || 0) ? (COLORS[Math.round(r.rating)] ?? '#facc15') : 'transparent',
                              stroke: idx < (r.rating || 0) ? (COLORS[Math.round(r.rating)] ?? '#facc15') : 'rgba(255,255,255,0.18)',
                            }} />
                        ))}
                      </div>
                      <span className="text-xs font-bold tabular-nums"
                        style={{ color: COLORS[Math.round(r.rating)] ?? '#facc15' }}>
                        {r.rating?.toFixed(1)}
                      </span>
                    </div>

                    {/* Date + year */}
                    <div className="flex items-center gap-2 text-white/35 text-xs">
                      {r.release_date && (
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {new Date(r.release_date).getFullYear()}
                        </span>
                      )}
                      {r.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditTarget(r)}
                    className="flex-shrink-0 self-start p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                    title="Edit rating"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Review */}
                {r.review && !r.review.startsWith('Liked from AI') && (
                  <div className="px-4 pb-4">
                    <p className="text-white/55 text-xs italic leading-relaxed line-clamp-2 border-l-2 border-white/10 pl-2">
                      "{r.review}"
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {ratings.length > 0 && (
          <div className="mt-8 rounded-xl p-5 border border-white/10 bg-white/5">
            <h3 className="text-white font-semibold mb-4 text-sm">Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Rated', value: ratings.length, color: 'text-purple-300' },
                { label: 'Avg score', value: ratings.length > 0 ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length).toFixed(1) : '—', color: 'text-yellow-300' },
                { label: 'Loved (8+)', value: ratings.filter(r => (r.rating || 0) >= 8).length, color: 'text-green-300' },
                { label: 'Series', value: ratings.filter(r => r.media_type === 'tv').length, color: 'text-blue-300' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-bold ${s.color}`} style={{ letterSpacing: '-0.03em' }}>{s.value}</div>
                  <div className="text-white/45 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <RatingModal
          movie={editTarget}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          existingRating={editTarget.rating}
        />
      )}
    </div>
  )
}