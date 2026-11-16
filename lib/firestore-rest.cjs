const { createSign } = require('node:crypto')
const { readFileSync } = require('node:fs')

let cachedToken
let pendingToken

function firestoreRoot() {
  const project = process.env.FIREBASE_PROJECT_ID
  if (!project || !/^[a-z][a-z0-9-]+$/.test(project)) throw new Error('Configure FIREBASE_PROJECT_ID.')
  return `projects/${project}/databases/(default)/documents`
}

async function exchangeToken() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!inline && !path) throw new Error('Configure the Firestore server service account.')
  let account
  try {
    account = JSON.parse(inline || readFileSync(path, 'utf8'))
  } catch {
    throw new Error('Cannot read Firestore service account configuration.')
  }
  if (account.project_id !== process.env.FIREBASE_PROJECT_ID) throw new Error('Firestore service account project mismatch.')
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const url = 'https://oauth2.googleapis.com/token'
  const now = Math.floor(Date.now() / 1000)
  const claims = encode({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: url, iat: now, exp: now + 3600 })
  const message = `${encode({ alg: 'RS256', typ: 'JWT' })}.${claims}`
  const signature = createSign('RSA-SHA256').update(message).sign(account.private_key, 'base64url')
  const response = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${message}.${signature}` }),
    cache: 'no-store', signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Firestore service account authentication failed (${response.status}).`)
  const result = await response.json()
  cachedToken = { value: result.access_token, expires: now + result.expires_in }
  return cachedToken.value
}

async function token() {
  if (cachedToken?.expires > Date.now() / 1000 + 60) return cachedToken.value
  pendingToken ??= exchangeToken().finally(() => { pendingToken = undefined })
  return pendingToken
}

class FirestoreError extends Error {
  constructor(status, code) {
    super(`Firestore request failed (${code || status}).`)
    this.status = status
    this.code = code
  }
}

async function firestore(action, body) {
  const response = await fetch(`https://firestore.googleapis.com/v1/${firestoreRoot()}${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store', signal: AbortSignal.timeout(20000),
  })
  const payload = await response.json()
  if (!response.ok) throw new FirestoreError(response.status, payload.error?.status)
  return payload
}

function encodeValue(value) {
  if (value == null) return { nullValue: null }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } }
  switch (typeof value) {
    case 'boolean': return { booleanValue: value }
    case 'string': return { stringValue: value }
    case 'bigint': return { integerValue: String(value) }
    case 'number':
      if (!Number.isFinite(value)) throw new Error('Expected a finite Firestore number.')
      return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
    default: return { mapValue: { fields: encodeFields(value) } }
  }
}

function encodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined).map(([key, value]) => [key, encodeValue(value)]))
}

function decodeValue(value) {
  if ('nullValue' in value) return null
  if ('integerValue' in value) {
    const number = Number(value.integerValue)
    return Number.isSafeInteger(number) ? number : BigInt(value.integerValue)
  }
  if ('timestampValue' in value) return new Date(value.timestampValue)
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue)
  if ('mapValue' in value) return decodeFields(value.mapValue.fields)
  return value.stringValue ?? value.booleanValue ?? value.doubleValue
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]))
}

module.exports = { firestore, firestoreRoot, FirestoreError, encodeValue, encodeFields, decodeFields }
