'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Check, UserPlus, X } from 'lucide-react'

type RequestItem = {
  id: string
  requester: { email: string; name: string; username: string }
  createdAt: string
}

export default function FriendRequestInbox() {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    const response = await fetch('/api/friends?view=requests', { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json()
    const next = data.requests || []
    setRequests(next)
    if (next.length) setExpanded(true)
  }, [status])

  useEffect(() => { void load() }, [load, pathname])

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setBusy(id)
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, requestId: id }),
      })
      if (!response.ok) return
      setRequests(current => current.filter(item => item.id !== id))
    } finally {
      setBusy(null)
    }
  }

  if (status !== 'authenticated' || !requests.length) return null

  const current = requests[0]
  if (!expanded) {
    return (
      <button className="friend-request-pill" onClick={() => setExpanded(true)}>
        <UserPlus className="h-4 w-4" /> {requests.length} friend request{requests.length === 1 ? '' : 's'}
      </button>
    )
  }

  return (
    <aside className="friend-request-card" aria-live="polite" aria-label="New friend request">
      <button className="friend-request-dismiss" onClick={() => setExpanded(false)} aria-label="Minimize friend requests">
        <X className="h-4 w-4" />
      </button>
      <div className="friend-request-avatar">{(current.requester.username || current.requester.name)[0]?.toUpperCase()}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{current.requester.name}</p>
        <p className="text-sm text-white/60">@{current.requester.username} wants to be friends</p>
        {requests.length > 1 && <p className="mt-1 text-xs text-white/40">+{requests.length - 1} more waiting</p>}
        <div className="mt-3 flex gap-2">
          <button disabled={!!busy} onClick={() => respond(current.id, 'accept')} className="friend-action friend-accept">
            <Check className="h-4 w-4" /> Accept
          </button>
          <button disabled={!!busy} onClick={() => respond(current.id, 'decline')} className="friend-action friend-decline">
            Decline
          </button>
          <button onClick={() => router.push('/social')} className="friend-action friend-view">View all</button>
        </div>
      </div>
    </aside>
  )
}
