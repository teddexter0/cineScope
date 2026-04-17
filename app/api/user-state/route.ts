import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveDailyFactState, type StoredDailyFactPreferences } from '@/lib/daily-fact-state'
import { prisma } from '@/lib/prisma'

const APP_STATE_KEY = '__cineScopeAppState'

type FavoritePerson = {
  id: number
  name: string
  profile_path?: string | null
  known_for_department?: string | null
  known_for?: any[]
  popularity?: number
  addedAt?: string
}

type AppState = {
  favoritePeople: FavoritePerson[]
  favoriteCategories: string[]
  dailyFact: Required<StoredDailyFactPreferences>
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function parseAppState(rawResponses: unknown): { responses: Record<string, any>; appState: AppState } {
  const record = asRecord(rawResponses)
  const rawAppState = asRecord(record[APP_STATE_KEY])
  const { [APP_STATE_KEY]: _ignored, ...responses } = record

  return {
    responses,
    appState: {
      favoritePeople: Array.isArray(rawAppState.favoritePeople) ? rawAppState.favoritePeople : [],
      favoriteCategories: Array.isArray(rawAppState.favoriteCategories) ? rawAppState.favoriteCategories : [],
      dailyFact: {
        enabled: rawAppState.dailyFact?.enabled !== false,
        seenIds: Array.isArray(rawAppState.dailyFact?.seenIds) ? rawAppState.dailyFact.seenIds : [],
        lastDate: typeof rawAppState.dailyFact?.lastDate === 'string' ? rawAppState.dailyFact.lastDate : null,
        lastFactId: typeof rawAppState.dailyFact?.lastFactId === 'number' ? rawAppState.dailyFact.lastFactId : null,
      },
    },
  }
}

function mergeResponses(responses: Record<string, any>, appState: AppState) {
  return {
    ...responses,
    [APP_STATE_KEY]: appState,
  }
}

async function getStateForUser(userId: string) {
  const [onboardingData, preferences, user] = await Promise.all([
    prisma.onboardingData.findUnique({ where: { userId } }),
    prisma.userPreferences.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ])

  if (!user?.email) {
    throw new Error('User not found')
  }

  const parsed = parseAppState(onboardingData?.responses)
  const resolvedDailyFact = resolveDailyFactState(user.email, parsed.appState.dailyFact)

  return {
    onboardingData,
    preferences,
    parsed,
    resolvedDailyFact,
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const state = await getStateForUser(userId)

    await prisma.onboardingData.upsert({
      where: { userId },
      update: {
        completed: state.onboardingData?.completed ?? false,
        responses: mergeResponses(state.parsed.responses, {
          ...state.parsed.appState,
          dailyFact: state.resolvedDailyFact.stored,
        }),
      },
      create: {
        userId,
        completed: false,
        responses: mergeResponses({}, {
          favoritePeople: state.parsed.appState.favoritePeople,
          favoriteCategories: state.parsed.appState.favoriteCategories,
          dailyFact: state.resolvedDailyFact.stored,
        }),
      },
    })

    return NextResponse.json({
      onboarding: {
        completed: state.onboardingData?.completed ?? false,
        responses: state.parsed.responses,
      },
      preferences: {
        personalityType: state.preferences?.personalityType ?? null,
        genreWeights: state.preferences?.genreWeights ?? {},
      },
      favoritePeople: state.parsed.appState.favoritePeople,
      favoriteCategories: state.parsed.appState.favoriteCategories,
      dailyFact: {
        enabled: state.resolvedDailyFact.stored.enabled,
        today: state.resolvedDailyFact.today,
        fact: state.resolvedDailyFact.fact,
        isNew: state.resolvedDailyFact.isNew,
      },
    })
  } catch (error) {
    console.error('[user-state GET]', error)
    return NextResponse.json({ error: 'Failed to load user state' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const state = await getStateForUser(userId)

    const nextResponses = body.onboarding?.responses !== undefined
      ? asRecord(body.onboarding.responses)
      : state.parsed.responses

    const nextCompleted = typeof body.onboarding?.completed === 'boolean'
      ? body.onboarding.completed
      : state.onboardingData?.completed ?? false

    const nextAppState: AppState = {
      favoritePeople: Array.isArray(body.favoritePeople) ? body.favoritePeople : state.parsed.appState.favoritePeople,
      favoriteCategories: Array.isArray(body.favoriteCategories) ? body.favoriteCategories : state.parsed.appState.favoriteCategories,
      dailyFact: {
        enabled: typeof body.dailyFact?.enabled === 'boolean'
          ? body.dailyFact.enabled
          : state.parsed.appState.dailyFact.enabled,
        seenIds: Array.isArray(body.dailyFact?.seenIds)
          ? body.dailyFact.seenIds
          : state.parsed.appState.dailyFact.seenIds,
        lastDate: typeof body.dailyFact?.lastDate === 'string' || body.dailyFact?.lastDate === null
          ? body.dailyFact.lastDate
          : state.parsed.appState.dailyFact.lastDate,
        lastFactId: typeof body.dailyFact?.lastFactId === 'number' || body.dailyFact?.lastFactId === null
          ? body.dailyFact.lastFactId
          : state.parsed.appState.dailyFact.lastFactId,
      },
    }

    const onboarding = await prisma.onboardingData.upsert({
      where: { userId },
      update: {
        completed: nextCompleted,
        responses: mergeResponses(nextResponses, nextAppState),
      },
      create: {
        userId,
        completed: nextCompleted,
        responses: mergeResponses(nextResponses, nextAppState),
      },
    })

    return NextResponse.json({
      success: true,
      onboarding: {
        completed: onboarding.completed,
        responses: nextResponses,
      },
      favoritePeople: nextAppState.favoritePeople,
      favoriteCategories: nextAppState.favoriteCategories,
      dailyFact: nextAppState.dailyFact,
    })
  } catch (error) {
    console.error('[user-state PATCH]', error)
    return NextResponse.json({ error: 'Failed to save user state' }, { status: 500 })
  }
}
