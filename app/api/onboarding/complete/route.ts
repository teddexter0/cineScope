// app/api/onboarding/complete/route.ts
// FIXED: Pass authOptions to getServerSession()

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { responses, completed } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.onboardingData.upsert({
      where: { userId: user.id },
      update: { responses, completed, updatedAt: new Date() },
      create: { userId: user.id, responses, completed },
    })

    const preferences = analyzeResponses(responses)

    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: preferences,
      create: { userId: user.id, ...preferences },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}

function analyzeResponses(responses: Record<number, string>) {
  const responseText = Object.values(responses).join(' ').toLowerCase()

  return {
    personalityType: 'Movie enthusiast',
    moodProfile: {
      preferred_times: responseText.includes('evening') ? ['evening'] : ['any'],
      viewing_context: responseText.includes('friends') ? 'social' : 'solo',
    },
    genreWeights: {
      Drama: 0.7,
      Comedy: 0.6,
      Action: 0.5,
      Thriller: 0.6,
    },
    sessionLength: 'feature-length',
  }
}