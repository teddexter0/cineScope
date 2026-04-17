import { CINE_FACTS, type CineFact } from '@/lib/daily-facts'

export interface StoredDailyFactPreferences {
  enabled?: boolean
  seenIds?: number[]
  lastDate?: string | null
  lastFactId?: number | null
}

export interface ResolvedDailyFactState {
  fact: CineFact
  isNew: boolean
  today: string
  stored: Required<StoredDailyFactPreferences>
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getCurrentFactDate(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function resolveDailyFactState(
  userEmail: string,
  input: StoredDailyFactPreferences = {},
  today = getCurrentFactDate()
): ResolvedDailyFactState {
  const stored: Required<StoredDailyFactPreferences> = {
    enabled: input.enabled ?? true,
    seenIds: Array.isArray(input.seenIds) ? input.seenIds.filter(id => Number.isInteger(id)) : [],
    lastDate: input.lastDate ?? null,
    lastFactId: typeof input.lastFactId === 'number' ? input.lastFactId : null,
  }

  if (stored.lastDate === today && stored.lastFactId) {
    const fact = CINE_FACTS.find(item => item.id === stored.lastFactId) ?? CINE_FACTS[0]
    return { fact, isNew: false, today, stored }
  }

  const allIds = CINE_FACTS.map(f => f.id)
  let seenIds = [...stored.seenIds]
  let pool = allIds.filter(id => !seenIds.includes(id))

  if (pool.length === 0) {
    seenIds = []
    pool = allIds
  }

  const chosen = pool[simpleHash(userEmail + today) % pool.length]
  const fact = CINE_FACTS.find(item => item.id === chosen) ?? CINE_FACTS[0]

  return {
    fact,
    isNew: true,
    today,
    stored: {
      ...stored,
      seenIds: [...seenIds, fact.id],
      lastDate: today,
      lastFactId: fact.id,
    },
  }
}
