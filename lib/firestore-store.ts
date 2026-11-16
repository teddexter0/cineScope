import { createHash, randomUUID } from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import { decodeFields, encodeFields, encodeValue, firestore, firestoreRoot } from './firestore-rest.cjs'

type Row = Record<string, any>
type Stored = { row: Row; name: string; updateTime?: string }
type Context = { transaction: string; writes: Row[] }
type Action = (context?: Context) => Promise<any>

const collections = {
  user: 'users', movie: 'movies', watchlist: 'watchlists', watchlistItem: 'watchlist_items',
  rating: 'ratings', episodeReview: 'episode_reviews', onboardingData: 'onboarding_data',
  userPreferences: 'user_preferences', follow: 'follows', notification: 'notifications',
} as const
type Model = keyof typeof collections

const uniqueFields: Partial<Record<Model, string[][]>> = {
  user: [['email'], ['username']], movie: [['tmdbId']], watchlist: [['userId', 'isDefault']],
  watchlistItem: [['userId', 'movieId']], rating: [['userId', 'movieId']],
  episodeReview: [['userId', 'movieId', 'seasonNumber', 'episodeNumber']],
  onboardingData: [['userId']], userPreferences: [['userId']], follow: [['followerId', 'followingId']],
}
const relationKeys = {
  movie: ['movie', 'movieId'], user: ['user', 'userId'], following: ['user', 'followingId'],
} as const

const fold = (value: any) => typeof value === 'string' ? value.toLowerCase() : value
const isObject = (value: any) => value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR') return condition.some((branch: Row) => matches(row, branch))
    if (!isObject(condition)) return row[key] === condition
    if ('in' in condition) return condition.in.includes(row[key])
    if ('not' in condition) return row[key] !== condition.not
    if ('path' in condition) return condition.path.reduce((value: any, part: string) => value?.[part], row[key]) === condition.equals
    const transform = condition.mode === 'insensitive' ? fold : (value: any) => value
    if ('equals' in condition) return transform(row[key]) === transform(condition.equals)
    if ('contains' in condition) return typeof row[key] === 'string' && transform(row[key]).includes(transform(condition.contains))
    return matches(row, condition)
  })
}

function flattenUnique(where: Row) {
  return Object.fromEntries(Object.entries(where).flatMap(([key, value]) => key.includes('_') && isObject(value) ? Object.entries(value) : [[key, value]]))
}

function stored(doc: Row): Stored {
  return { row: decodeFields(doc.fields), name: doc.name, updateTime: doc.updateTime }
}

async function byIds(model: Model, ids: string[], context?: Context): Promise<Stored[]> {
  const valid = Array.from(new Set(ids)).filter((id) => typeof id === 'string' && id && !id.includes('/') && id !== '.' && id !== '..')
  if (!valid.length) return []
  const responses = await Promise.all(Array.from({ length: Math.ceil(valid.length / 100) }, (_, index) => firestore(':batchGet', {
    documents: valid.slice(index * 100, (index + 1) * 100).map((id) => `${firestoreRoot()}/${collections[model]}/${id}`),
    transaction: context?.transaction,
  })))
  return responses.flatMap((items) => items.flatMap((item: Row) => item.found ? [stored(item.found)] : []))
}

async function query(model: Model, where: Row, context?: Context): Promise<Stored[]> {
  if (where.id !== undefined && (typeof where.id === 'string' || where.id.in)) {
    return (await byIds(model, typeof where.id === 'string' ? [where.id] : where.id.in, context)).filter((entry) => matches(entry.row, where))
  }
  const field = ['userId', 'followerId', 'tmdbId', 'email', 'username', 'name', 'isActive']
    .find((key) => typeof where[key] === 'string' || typeof where[key] === 'number' || typeof where[key] === 'boolean' ||
      Array.isArray(where[key]?.in) || (where[key]?.mode === 'insensitive' && typeof where[key]?.equals === 'string'))
  const condition = field ? where[field] : undefined
  const insensitive = model === 'user' && condition?.mode === 'insensitive' && ['email', 'username', 'name'].includes(field)
  const filteredField = insensitive ? `${field}Lower` : field
  const values = condition?.in as unknown[] | undefined
  const chunks = values ? Array.from({ length: Math.ceil(values.length / 30) }, (_, i) => values.slice(i * 30, (i + 1) * 30)) : [undefined]
  const responses = await Promise.all(chunks.map((chunk) => firestore(':runQuery', {
    structuredQuery: {
      from: [{ collectionId: collections[model] }],
      where: filteredField ? { fieldFilter: { field: { fieldPath: filteredField }, op: chunk ? 'IN' : 'EQUAL', value: encodeValue(chunk ?? (insensitive ? fold(condition.equals) : condition)) } } : undefined,
    },
    transaction: context?.transaction,
  })))
  return responses.flatMap((items) => items.flatMap((item: Row) => item.document ? [stored(item.document)] : []))
    .filter((entry) => matches(entry.row, where))
}

function project(row: Row, select?: Row) {
  if (select) return Object.fromEntries(Object.keys(select).filter((field) => select[field]).map((field) => [field, row[field]]))
  const { emailLower, usernameLower, nameLower, ...data } = row
  return data
}

async function include(rows: Row[], options: Row, context?: Context) {
  const relations = Object.entries(options.include ?? {})
  for (const [name, config] of relations) {
    const [model, key] = relationKeys[name]
    const joined = new Map((await byIds(model, rows.map((row) => row[key]), context)).map(({ row }) => [row.id, row]))
    rows = rows.flatMap((row) => {
      const record = joined.get(row[key])
      return record ? [{ ...row, [name]: project(record, (config as Row)?.select) }] : []
    })
  }
  return rows.map((row) => project(row, options.select))
}

function defaults(model: Model, data: Row) {
  const now = new Date()
  const base: Partial<Record<Model, Row>> = {
    user: { username: null, name: null, isActive: true, usernameChangedAt: null, usernameChangeCount: 0 },
    watchlist: { isDefault: false, isPublic: false }, watchlistItem: { priority: 0, notes: null, addedAt: now, watchedAt: null },
    onboardingData: { completed: false, responses: {} }, notification: { isRead: false },
  }
  return { id: randomUUID(), createdAt: now, updatedAt: now, ...base[model], ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) }
}

function normalize(model: Model, data: Row) {
  if (model !== 'user') return data
  const { password: _password, ...profile } = data
  for (const key of ['email', 'username', 'name']) if (key in profile) profile[`${key}Lower`] = fold(profile[key])
  return profile
}

function uniqueError(fields: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Record already exists.', { code: 'P2002', clientVersion: 'firestore', meta: { target: fields } })
}

async function uniqueWrites(model: Model, row: Row, previous: Row, context: Context) {
  for (const fields of uniqueFields[model] ?? []) {
    if (model === 'watchlist' && !row.isDefault) continue
    const values = fields.map((field) => model === 'user' ? fold(row[field]) : row[field])
    if (values.some((value) => value == null)) continue
    const prior = fields.map((field) => model === 'user' ? fold(previous?.[field]) : previous?.[field])
    if (values.every((value, index) => value === prior[index])) continue
    const where = Object.fromEntries(fields.map((field, index) => [field, model === 'user' ? { equals: values[index], mode: 'insensitive' } : values[index]]))
    if ((await query(model, where, context)).some((entry) => entry.row.id !== row.id)) throw uniqueError(fields)
    const lock = (parts: any[]) => `${firestoreRoot()}/unique_keys/${createHash('sha256').update(JSON.stringify([model, fields, parts])).digest('hex')}`
    context.writes.push({ update: { name: lock(values), fields: encodeFields({ id: row.id }) }, currentDocument: { exists: false } })
    if (prior.every((value) => value != null)) context.writes.push({ delete: lock(prior) })
  }
}

async function transaction(actions: Action[]) {
  for (let attempt = 0; ; attempt++) {
    const { transaction } = await firestore(':beginTransaction', {})
    const context: Context = { transaction, writes: [] }
    try {
      const results = []
      for (const action of actions) results.push(await action(context))
      await firestore(':commit', { transaction, writes: context.writes })
      return results
    } catch (error) {
      await firestore(':rollback', { transaction }).catch(() => undefined)
      if (attempt >= 3 || !['ABORTED', 'ALREADY_EXISTS', 'FAILED_PRECONDITION'].includes(error.code)) throw error
    }
  }
}

class Operation implements PromiseLike<any> {
  constructor(readonly action: Action, private readonly write = false) {}
  then<TResult1 = any, TResult2 = never>(onfulfilled?: (value: any) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>) {
    const result = this.write ? transaction([this.action]).then(([value]) => value) : this.action()
    return result.then(onfulfilled, onrejected)
  }
}

function repository(model: Model) {
  function find(options: Row = {}, first = false) {
    return new Operation(async () => {
      if (options.where?.OR && !options.where.OR.length) return first ? null : []
      const rows = (await query(model, flattenUnique(options.where ?? {}))).map((entry) => entry.row)
      const ordering = [options.orderBy ?? []].flat()
      rows.sort((left, right) => {
        for (const item of ordering) for (const [field, direction] of Object.entries(item)) {
          const a = left[field], b = right[field]
          const compare = a === b ? 0 : a == null ? 1 : b == null ? -1 : a > b ? 1 : -1
          if (compare) return direction === 'desc' ? -compare : compare
        }
        return 0
      })
      const result = await include(rows.slice(0, first ? 1 : options.take), options)
      return first ? result[0] ?? null : result
    })
  }

  function save(options: Row, mode: 'create' | 'update' | 'upsert') {
    return new Operation(async (context: Context) => {
      const existing = mode === 'create' ? null : (await query(model, flattenUnique(options.where), context))[0]
      if (!existing && mode === 'update') throw new Error('Record not found.')
      const input = mode === 'upsert' ? existing ? options.update : options.create : options.data
      const data = normalize(model, input)
      const row: Row = existing ? { ...existing.row, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)), updatedAt: new Date() } : defaults(model, data)
      await uniqueWrites(model, row, existing?.row, context)
      context.writes.push({ update: { name: `${firestoreRoot()}/${collections[model]}/${row.id}`, fields: encodeFields(row) }, currentDocument: existing ? { updateTime: existing.updateTime } : { exists: false } })
      return (await include([row], options, context))[0]
    }, true)
  }

  return {
    findMany: (options: Row) => find(options), findFirst: (options: Row) => find(options, true), findUnique: (options: Row) => find(options, true),
    create: (options: Row) => save(options, 'create'), update: (options: Row) => save(options, 'update'), upsert: (options: Row) => save(options, 'upsert'),
    deleteMany: (options: Row) => new Operation(async (context: Context) => {
      const rows = await query(model, options.where, context)
      for (const { name, row } of rows) {
        context.writes.push({ delete: name })
        for (const fields of uniqueFields[model] ?? []) {
          const parts = fields.map((field) => row[field])
          const id = createHash('sha256').update(JSON.stringify([model, fields, parts])).digest('hex')
          context.writes.push({ delete: `${firestoreRoot()}/unique_keys/${id}` })
        }
      }
      return { count: rows.length }
    }, true),
  }
}

export const usesFirestore = () => Boolean(process.env.FIREBASE_PROJECT_ID)

export function withFirestore(legacy: PrismaClient): PrismaClient {
  if (!usesFirestore()) return legacy
  const models = Object.fromEntries(Object.keys(collections).map((name: Model) => [name, repository(name)]))
  return { ...models, $transaction: (operations: Operation[]) => transaction(operations.map(({ action }) => action)) } as unknown as PrismaClient
}
