'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Star, X } from 'lucide-react'
import Image from 'next/image'

export type ReviewContext = { scope: 'title' | 'episode'; seasonNumber?: number; episodeNumber?: number; isPublic?: boolean; spoilers?: boolean }
interface Props { movie: any; isOpen: boolean; onClose: () => void; onSubmit: (rating: number, review: string, context?: ReviewContext) => void; existingRating?: number }

const LABELS: Record<number,string> = { 1:'Unwatchable',2:'Very bad',3:'Bad',4:'Below avg',5:'Average',6:'Decent',7:'Good',8:'Great',9:'Excellent',10:'Masterpiece' }
const COLORS: Record<number,string> = { 1:'#ef4444',2:'#f97316',3:'#fb923c',4:'#facc15',5:'#a3e635',6:'#4ade80',7:'#34d399',8:'#22d3ee',9:'#818cf8',10:'#e879f9' }

export default function RatingModal({ movie, isOpen, onClose, onSubmit, existingRating }: Props) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(existingRating || 0)
  const [review, setReview] = useState('')
  const [done, setDone] = useState(false)
  const [scope, setScope] = useState<'title' | 'episode'>('title')
  const [seasonNumber, setSeasonNumber] = useState(1)
  const [episodeNumber, setEpisodeNumber] = useState(1)
  const [isPublic, setIsPublic] = useState(true)
  const [spoilers, setSpoilers] = useState(false)
  const isTv = movie?.media_type === 'tv'

  useEffect(() => {
    if (!isOpen) return
    setSelected(existingRating || 0); setHovered(0); setDone(false); setReview(movie?.review || '')
    setScope(movie?.seasonNumber !== undefined ? 'episode' : 'title')
    setSeasonNumber(movie?.seasonNumber ?? 1); setEpisodeNumber(movie?.episodeNumber ?? 1)
    setIsPublic(movie?.isPublic !== false); setSpoilers(movie?.spoilers === true)
  }, [isOpen, existingRating, movie])

  const active = hovered || selected
  const submit = () => {
    if (!selected) return
    onSubmit(selected, review, { scope, seasonNumber: scope === 'episode' ? seasonNumber : undefined, episodeNumber: scope === 'episode' ? episodeNumber : undefined, isPublic, spoilers })
    setDone(true); setTimeout(onClose, 800)
  }

  return <AnimatePresence>{isOpen && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 px-3 backdrop-blur-md sm:items-center" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }} className="mb-3 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/12 bg-[#0b0b0f] shadow-2xl sm:mb-0">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[#0b0b0f]/95 p-4 backdrop-blur-xl">
          {movie?.poster_path && <Image src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title || movie.name} width={38} height={56} className="h-14 w-10 rounded-md object-cover" />}
          <div className="min-w-0 flex-1"><p className="truncate text-base font-semibold text-white">{movie?.displayTitle || movie?.title || movie?.name}</p><p className="text-sm text-white/45">{movie?.release_date ? new Date(movie.release_date).getFullYear() : ''} · {isTv ? 'Series' : 'Film'}</p></div>
          <button onClick={onClose} className="rounded-full bg-white/8 p-2 text-white/60" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          {done ? <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center"><div className="mb-2 text-5xl" style={{ color: COLORS[selected] }}>✓</div><p className="text-base text-white/70">{scope === 'episode' ? `Episode review saved · ${selected}/10` : `Rated ${selected}/10`}</p></motion.div> : <>
            <div className="mb-5 flex h-16 flex-col items-center justify-center text-center">{active ? <><div><span className="text-5xl font-black tabular-nums" style={{ color: COLORS[active] }}>{active}</span><span className="text-xl text-white/30"> /10</span></div><p className="mt-1 text-xs font-bold uppercase tracking-[.18em]" style={{ color: COLORS[active] }}>{LABELS[active]}</p></> : <p className="text-base text-white/40">Tap a star to rate</p>}</div>
            <div className="mb-5 flex justify-center gap-1">{Array.from({ length: 10 }, (_, i) => i + 1).map(number => <motion.button key={number} whileTap={{ scale: .86 }} onMouseEnter={() => setHovered(number)} onMouseLeave={() => setHovered(0)} onClick={() => setSelected(number)} aria-label={`${number} out of 10`}><Star className="h-7 w-7 sm:h-6 sm:w-6" style={{ fill: number <= active ? COLORS[active] : 'transparent', stroke: number <= active ? COLORS[active] : 'rgba(255,255,255,.22)' }} /></motion.button>)}</div>

            {isTv && <div className="mb-4"><div className="grid grid-cols-2 rounded-xl bg-white/6 p-1" role="group" aria-label="Review scope"><button onClick={() => setScope('title')} className={`rounded-lg py-2.5 text-sm font-semibold ${scope === 'title' ? 'bg-white text-black' : 'text-white/55'}`}>Whole series</button><button onClick={() => setScope('episode')} className={`rounded-lg py-2.5 text-sm font-semibold ${scope === 'episode' ? 'bg-white text-black' : 'text-white/55'}`}>One episode</button></div>
              {scope === 'episode' && <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm font-medium text-white/55">Season<input type="number" min={0} max={99} value={seasonNumber} onChange={e => setSeasonNumber(Math.max(0, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2.5 text-base text-white outline-none focus:border-white/50" /></label><label className="text-sm font-medium text-white/55">Episode<input type="number" min={1} max={999} value={episodeNumber} onChange={e => setEpisodeNumber(Math.max(1, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2.5 text-base text-white outline-none focus:border-white/50" /></label></div>}
            </div>}

            <textarea value={review} onChange={e => setReview(e.target.value)} placeholder={scope === 'episode' ? 'What stood out in this episode?' : 'Share a quick thought… (optional)'} maxLength={500} rows={3} className="mb-3 w-full resize-none rounded-xl border border-white/12 bg-white/7 px-3 py-3 text-base text-white/85 placeholder-white/35 outline-none focus:border-white/40" />
            {scope === 'episode' && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"><button onClick={() => setIsPublic(value => !value)} className="flex items-center gap-2 text-sm text-white/75">{isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{isPublic ? 'Shared publicly' : 'Private review'}</button><label className="flex items-center gap-1.5 text-xs text-white/55"><input type="checkbox" checked={spoilers} onChange={e => setSpoilers(e.target.checked)} className="accent-white" /> Spoilers</label></div>}
            <button onClick={submit} disabled={!selected} className="w-full rounded-xl bg-white py-3.5 text-base font-bold text-black transition active:scale-[.98] disabled:bg-white/10 disabled:text-white/30">{selected ? (scope === 'episode' ? `Publish episode review · ${selected}/10` : `Submit ${selected}/10`) : 'Select a rating first'}</button>
          </>}
        </div>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>
}
