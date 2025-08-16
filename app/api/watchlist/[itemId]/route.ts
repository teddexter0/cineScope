// app/api/watchlist/[itemId]/route.ts - FIXED WITHOUT PRISMA DEPENDENCY

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Use the same in-memory storage as the main watchlist route
const sessionWatchlist = new Map<string, any[]>()

// Update watchlist item (rating, review, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = session.user.email
    const { rating, review, status, notes } = await request.json()

    // Get user's watchlist
    const userWatchlist = sessionWatchlist.get(userEmail) || []
    
    // Find the item to update
    const itemIndex = userWatchlist.findIndex(item => item.id === params.itemId)
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item
    const updatedItem = {
      ...userWatchlist[itemIndex],
      status: status || userWatchlist[itemIndex].status,
      notes: notes || userWatchlist[itemIndex].notes,
      rating: rating !== undefined ? rating : userWatchlist[itemIndex].rating,
      review: review || userWatchlist[itemIndex].review,
      updatedAt: new Date().toISOString()
    }

    userWatchlist[itemIndex] = updatedItem
    sessionWatchlist.set(userEmail, userWatchlist)

    console.log('📝 Updated watchlist item:', updatedItem.title)

    return NextResponse.json({ 
      success: true, 
      item: updatedItem,
      message: `${updatedItem.title} updated successfully`
    })

  } catch (error) {
    console.error('❌ Update watchlist item error:', error)
    return NextResponse.json({ 
      error: 'Failed to update item: ' + error.message 
    }, { status: 500 })
  }
}

// Delete watchlist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = session.user.email
    
    // Get user's watchlist
    const userWatchlist = sessionWatchlist.get(userEmail) || []
    
    // Find the item to delete
    const itemToDelete = userWatchlist.find(item => item.id === params.itemId)
    
    if (!itemToDelete) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Remove the item
    const updatedWatchlist = userWatchlist.filter(item => item.id !== params.itemId)
    sessionWatchlist.set(userEmail, updatedWatchlist)

    console.log('🗑️ Deleted watchlist item:', itemToDelete.title)

    return NextResponse.json({ 
      success: true,
      message: `${itemToDelete.title} removed from watchlist`
    })

  } catch (error) {
    console.error('❌ Delete watchlist item error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete item: ' + error.message 
    }, { status: 500 })
  }
}