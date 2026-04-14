// app/api/watchlist/[itemId]/route.ts
// FIXED: Always pass authOptions to getServerSession()

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Reuse the same global map as the parent watchlist route
declare global {
  // eslint-disable-next-line no-var
  var __cineWatchlist: Map<string, any[]> | undefined
}
// Will be populated by the parent route module; safe to reference here
const sessionWatchlist = (): Map<string, any[]> => {
  if (!global.__cineWatchlist) global.__cineWatchlist = new Map()
  return global.__cineWatchlist
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = session.user.email
    const { rating, review, status, notes } = await request.json()

    const userWatchlist = sessionWatchlist().get(userEmail) || []
    const itemIndex = userWatchlist.findIndex(item => item.id === params.itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const updatedItem = {
      ...userWatchlist[itemIndex],
      status: status ?? userWatchlist[itemIndex].status,
      notes: notes ?? userWatchlist[itemIndex].notes,
      rating: rating !== undefined ? rating : userWatchlist[itemIndex].rating,
      review: review ?? userWatchlist[itemIndex].review,
      updatedAt: new Date().toISOString(),
    }

    userWatchlist[itemIndex] = updatedItem
    sessionWatchlist().set(userEmail, userWatchlist)

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error: any) {
    console.error('❌ Update watchlist item error:', error)
    return NextResponse.json({ error: 'Failed to update item: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = session.user.email
    const userWatchlist = sessionWatchlist().get(userEmail) || []
    const item = userWatchlist.find(i => i.id === params.itemId)

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    sessionWatchlist().set(userEmail, userWatchlist.filter(i => i.id !== params.itemId))

    return NextResponse.json({ success: true, message: `${item.title} removed from watchlist` })
  } catch (error: any) {
    console.error('❌ Delete watchlist item error:', error)
    return NextResponse.json({ error: 'Failed to delete item: ' + error.message }, { status: 500 })
  }
}