// app/api/onboarding/complete/route.ts
// FIXED: Pass authOptions to getServerSession()

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const APP_STATE_KEY = '__cineScopeAppState'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { responses, completed } = body ?? {}
    if (!responses || typeof responses !== 'object' || Array.isArray(responses) || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid onboarding responses' }, { status: 400 })
    }


    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.onboardingData.findUnique({
      where: { userId: user.id },
      select: { responses: true },
    })
    const existingResponses = existing?.responses && typeof existing.responses === 'object' && !Array.isArray(existing.responses)
      ? existing.responses as Record<string, any>
      : {}
    const preservedAppState = existingResponses[APP_STATE_KEY]
    const mergedResponses = preservedAppState
      ? { ...responses, [APP_STATE_KEY]: preservedAppState }
      : responses

    const preferences = analyzeResponses(responses)

    await prisma.$transaction([
      prisma.onboardingData.upsert({
        where: { userId: user.id },
        update: { responses: mergedResponses, completed },
        create: { userId: user.id, responses: mergedResponses, completed },
      }),
      prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: preferences,
        create: { userId: user.id, ...preferences },
      }),
    ])

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
