
// Create: app/api/watchlist/[itemId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const { rating, review, status, notes } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update watchlist item
    const updatedItem = await prisma.watchlistItem.update({
      where: { id: params.itemId },
      data: {
        status,
        notes
      }
    })

    // If rating is provided, create/update rating
    if (rating !== undefined) {
      await prisma.rating.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: updatedItem.movieId
          }
        },
        update: {
          rating,
          review: review || null
        },
        create: {
          userId: user.id,
          movieId: updatedItem.movieId,
          rating,
          review: review || null
        }
      })
    }

    return NextResponse.json({ success: true, item: updatedItem })

  } catch (error) {
    console.error('Update watchlist item error:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
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

    await prisma.watchlistItem.delete({
      where: { id: params.itemId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete watchlist item error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}