'use client'
// app/components/RatingModal.tsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'
import Image from 'next/image'

interface Props {
  movie: any; isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, review: string) => void
  existingRating?: number
}

const LABELS: Record<number,string> = { 1:'Unwatchable',2:'Very bad',3:'Bad',4:'Below avg',5:'Average',6:'Decent',7:'Good',8:'Great',9:'Excellent',10:'Masterpiece' }
const COLORS: Record<number,string> = { 1:'#ef4444',2:'#f97316',3:'#fb923c',4:'#facc15',5:'#a3e635',6:'#4ade80',7:'#34d399',8:'#22d3ee',9:'#818cf8',10:'#e879f9' }

export default function RatingModal({ movie, isOpen, onClose, onSubmit, existingRating }: Props) {
  const [hov, setHov]     = useState(0)
  const [sel, setSel]     = useState(existingRating || 0)
  const [review, setReview] = useState('')
  const [done, setDone]   = useState(false)

  useEffect(() => { if (isOpen) { setSel(existingRating || 0); setHov(0); setDone(false) } }, [isOpen, existingRating])

  const active = hov || sel

  const submit = () => {
    if (!sel) return
    onSubmit(sel, review); setDone(true)
    setTimeout(onClose, 750)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4"
          style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}>
          <motion.div initial={{ y:50,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:30,opacity:0 }}
            transition={{ type:'spring', stiffness:340, damping:28 }}
            className="w-full max-w-sm mb-4 sm:mb-0 rounded-xl overflow-hidden"
            style={{ background:'linear-gradient(160deg,rgba(12,10,26,0.99) 0%,rgba(20,16,42,0.99) 100%)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 32px 80px rgba(0,0,0,0.65)', fontFamily:"'DM Sans',sans-serif" }}>

            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              {movie?.poster_path && (
                <div className="w-9 h-13 rounded overflow-hidden flex-shrink-0">
                  <Image src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title||movie.name} width={36} height={52} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate" style={{ letterSpacing:'-0.01em' }}>{movie?.displayTitle||movie?.title||movie?.name}</p>
                <p className="text-white/38 text-xs">{movie?.release_date ? new Date(movie.release_date).getFullYear() : ''} · {movie?.media_type==='tv' ? 'Series' : 'Film'}</p>
              </div>
              <button onClick={onClose} className="text-white/28 hover:text-white/60 transition-colors p-1"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5">
              {done ? (
                <motion.div initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }} className="text-center py-5">
                  <div className="text-4xl mb-2" style={{ color: COLORS[sel] }}>✓</div>
                  <p className="text-white/65 text-sm">Rated {sel}/10</p>
                </motion.div>
              ) : (
                <>
                  <div className="text-center mb-5 h-14 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      {active ? (
                        <motion.div key={active} initial={{ y:-7,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:7,opacity:0 }} transition={{ duration:0.1 }}>
                          <span className="text-5xl font-black tabular-nums" style={{ color:COLORS[active], letterSpacing:'-0.04em' }}>{active}</span>
                          <span className="text-white/28 text-lg"> /10</span>
                          <p className="text-xs mt-0.5 font-medium uppercase tracking-widest" style={{ color:COLORS[active], opacity:0.72 }}>{LABELS[active]}</p>
                        </motion.div>
                      ) : (
                        <motion.p key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-white/28 text-sm">Tap a star to rate</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-center gap-1 mb-4">
                    {Array.from({length:10},(_,i)=>i+1).map(n => (
                      <motion.button key={n} whileHover={{ scale:1.2 }} whileTap={{ scale:0.88 }}
                        onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(0)} onClick={()=>setSel(n)}>
                        <Star className="w-6 h-6" style={{ fill:n<=active?(COLORS[active]??'#facc15'):'transparent', stroke:n<=active?(COLORS[active]??'#facc15'):'rgba(255,255,255,0.2)', transition:'all 0.1s' }} />
                      </motion.button>
                    ))}
                  </div>

                  <div className="h-1 w-full rounded bg-white/8 overflow-hidden mb-4">
                    <motion.div className="h-full rounded" style={{ background:active?COLORS[active]:'transparent' }}
                      animate={{ width:active?`${active*10}%`:'0%' }} transition={{ type:'spring',stiffness:200,damping:22 }} />
                  </div>

                  <textarea value={review} onChange={e=>setReview(e.target.value)}
                    placeholder="Quick thought… (optional)" maxLength={200} rows={2}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white/78 placeholder-white/22 resize-none focus:outline-none focus:ring-1 focus:ring-white/18 mb-4"
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }} />

                  <button onClick={submit} disabled={!sel}
                    className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-28"
                    style={{ background:sel?`linear-gradient(135deg,${COLORS[sel]},${COLORS[Math.min(sel+2,10)]})`:'rgba(255,255,255,0.09)', color:sel?'#0f0f1e':'rgba(255,255,255,0.28)', letterSpacing:'-0.01em' }}>
                    {sel ? `Submit ${sel}/10` : 'Select a rating first'}
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