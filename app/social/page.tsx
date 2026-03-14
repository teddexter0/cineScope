'use client'
// app/social/page.tsx — Friends, Leaderboard, and Activity Feed

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeft, Users, Trophy, Activity, UserPlus, Search, X, CheckCircle, Film, Tv } from 'lucide-react'

type SocialTab = 'friends' | 'leaderboard' | 'feed'

interface Friend { email: string; name: string; username: string }
interface ActivityItem {
  id: string; userEmail: string; username: string; name: string
  action: 'added' | 'watched'; title: string; mediaType: 'movie' | 'tv'
  posterPath: string | null; timestamp: string
}
interface LeaderboardEntry {
  profile: Friend; count: number; recentTitles: string[]
}

export default function SocialPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<SocialTab>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const myEmail    = session?.user?.email    || ''
  const myName     = session?.user?.name     || ''
  const myUsername = session?.user?.username || ''

  // Register this user + load data when authenticated
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated') return

    // Register profile
    fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email: myEmail, name: myName, username: myUsername || undefined }),
    }).then(() => loadAll())
  }, [status])

  const loadAll = useCallback(async () => {
    if (!myEmail) return
    setIsLoading(true)
    try {
      const [fRes, aRes, lRes] = await Promise.all([
        fetch(`/api/friends?me=${encodeURIComponent(myEmail)}&view=friends`),
        fetch(`/api/friends?me=${encodeURIComponent(myEmail)}&view=activity`),
        fetch(`/api/friends?me=${encodeURIComponent(myEmail)}&view=leaderboard`),
      ])
      const [fData, aData, lData] = await Promise.all([fRes.json(), aRes.json(), lRes.json()])
      setFriends(fData.friends || [])
      setActivity(aData.activity || [])
      setLeaderboard(lData.leaderboard || [])
    } finally {
      setIsLoading(false)
    }
  }, [myEmail])

  const searchUsers = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/friends?me=${encodeURIComponent(myEmail)}&view=search&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } finally {
      setIsSearching(false)
    }
  }

  const addFriend = async (friend: Friend) => {
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', myEmail, query: friend.username }),
    })
    const data = await res.json()
    if (data.success) {
      setFriends(prev => [...prev, friend])
      setSearchResults(prev => prev.filter(r => r.email !== friend.email))
      showToast(`${friend.name} added!`, 'success')
    } else {
      showToast(data.error || 'Could not add friend', 'error')
    }
  }

  const removeFriend = async (friendEmail: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', myEmail, friendEmail }),
    })
    setFriends(prev => prev.filter(f => f.email !== friendEmail))
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    const el = document.createElement('div')
    el.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (status === 'loading' || isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/90 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" /> Social
          </h1>
          <p className="text-purple-200 mt-1">Friends, leaderboard, and what everyone's been watching</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'friends',     icon: <Users className="w-4 h-4" />,    label: `Friends (${friends.length})` },
            { key: 'leaderboard', icon: <Trophy className="w-4 h-4" />,   label: 'Leaderboard' },
            { key: 'feed',        icon: <Activity className="w-4 h-4" />, label: 'Activity Feed' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as SocialTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t.key ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Friends Tab ───────────────────────────────────────────── */}
        {tab === 'friends' && (
          <div className="space-y-4">
            {/* Search box */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-400" /> Add a Friend
              </h3>
              <p className="text-white/50 text-xs mb-3">Search by username, display name, or email prefix (part before @)</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUsers()}
                    placeholder="e.g. john.doe, cinefan42…"
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <button onClick={searchUsers} disabled={isSearching || searchQuery.length < 2}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {isSearching ? '…' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map(u => (
                    <div key={u.email} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-white font-medium text-sm">{u.name}</p>
                        <p className="text-white/50 text-xs">@{u.username}</p>
                      </div>
                      {friends.some(f => f.email === u.email) ? (
                        <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Following</span>
                      ) : (
                        <button onClick={() => addFriend(u)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length > 1 && searchResults.length === 0 && !isSearching && (
                <p className="text-white/40 text-xs mt-3 text-center">No users found for "{searchQuery}". They may not have signed in yet.</p>
              )}
            </div>

            {/* Friends list */}
            {friends.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No friends yet. Search above to find people!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(f => (
                  <motion.div key={f.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white/10 rounded-xl px-5 py-4 border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {(f.username || f.name)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{f.username || f.name}</p>
                        <p className="text-white/50 text-xs">@{f.username}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFriend(f.email)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1" title="Remove friend">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ───────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <div className="space-y-3">
            <p className="text-white/50 text-sm mb-2">Ranked by activity in the last 7 days (titles added + watched)</p>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No activity yet. Add friends and start watching!</p>
              </div>
            ) : leaderboard.map((entry, i) => {
              const medals = ['🥇', '🥈', '🥉']
              const isMe = entry.profile.email === myEmail
              return (
                <motion.div key={entry.profile.email}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 rounded-xl px-5 py-4 border ${isMe ? 'bg-purple-500/20 border-purple-500/40' : 'bg-white/10 border-white/20'}`}>
                  <div className="text-2xl w-8 text-center">{medals[i] || `${i + 1}`}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(entry.profile.username || entry.profile.name)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{entry.profile.username || entry.profile.name}{isMe && <span className="text-purple-300 text-xs ml-2">(you)</span>}</p>
                    <p className="text-white/50 text-xs truncate">
                      {entry.count} {entry.count === 1 ? 'title' : 'titles'} this week
                      {entry.recentTitles.length > 0 && ` · ${entry.recentTitles.join(', ')}`}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{entry.count}</div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── Activity Feed Tab ─────────────────────────────────────── */}
        {tab === 'feed' && (
          <div className="space-y-3">
            {activity.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No activity yet. Add friends or mark something as watched!</p>
              </div>
            ) : activity.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-3 border border-white/20">
                {/* Poster or icon */}
                <div className="w-10 h-14 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                  {item.posterPath ? (
                    <Image src={`https://image.tmdb.org/t/p/w92${item.posterPath}`} alt={item.title} width={40} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {item.mediaType === 'tv' ? '📺' : '🎬'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">
                    <span className="font-semibold text-purple-300">@{item.username}</span>
                    <span className="text-white/60"> {item.action === 'watched' ? 'watched' : 'added to watchlist'}</span>
                  </p>
                  <p className="text-white font-medium text-sm truncate">"{item.title}"</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs flex items-center gap-0.5 ${item.mediaType === 'tv' ? 'text-pink-400' : 'text-blue-400'}`}>
                      {item.mediaType === 'tv' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      {item.mediaType === 'tv' ? 'Series' : 'Movie'}
                    </span>
                    <span className="text-white/40 text-xs">· {timeAgo(item.timestamp)}</span>
                  </div>
                </div>
                {item.action === 'watched' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
