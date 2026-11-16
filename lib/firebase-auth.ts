export class FirebaseAuthError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

export function usesFirebaseAuth() {
  if (process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_AUTH_API_KEY) {
    throw new FirebaseAuthError('FIREBASE_AUTH_NOT_CONFIGURED')
  }
  return Boolean(process.env.FIREBASE_AUTH_API_KEY)
}

async function requestAuth(action: string, body: Record<string, string | boolean>) {
  const apiKey = process.env.FIREBASE_AUTH_API_KEY
  if (!apiKey) throw new FirebaseAuthError('FIREBASE_AUTH_NOT_CONFIGURED')

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  const result = await response.json()
  if (!response.ok) {
    const code = String(result.error?.message ?? '').split(/[ :]/, 1)[0]
    throw new FirebaseAuthError(/^[A-Z0-9_]+$/.test(code) ? code : 'FIREBASE_AUTH_UNAVAILABLE')
  }
  return result as { localId?: string }
}

export async function firebasePasswordSignIn(email: string, password: string) {
  try {
    const { localId } = await requestAuth('signInWithPassword', { email, password, returnSecureToken: true })
    if (!localId) throw new FirebaseAuthError('FIREBASE_AUTH_UNAVAILABLE')
    return localId
  } catch (error) {
    if (error instanceof FirebaseAuthError && [
      'EMAIL_NOT_FOUND', 'INVALID_PASSWORD', 'INVALID_LOGIN_CREDENTIALS', 'USER_DISABLED',
    ].includes(error.code)) return null
    throw error
  }
}

export async function firebasePasswordSignUp(email: string, password: string) {
  try {
    const { localId } = await requestAuth('signUp', { email, password, returnSecureToken: true })
    if (!localId) throw new FirebaseAuthError('FIREBASE_AUTH_UNAVAILABLE')
    return localId
  } catch (error) {
    if (!(error instanceof FirebaseAuthError) || error.code !== 'EMAIL_EXISTS') throw error
    // A Firebase account can exist after an interrupted CineScope profile write.
    // Only the owner who proves the password can complete that signup.
    const localId = await firebasePasswordSignIn(email, password)
    if (!localId) throw error
    return localId
  }
}

export async function sendFirebasePasswordReset(email: string) {
  try {
    await requestAuth('sendOobCode', { requestType: 'PASSWORD_RESET', email })
  } catch (error) {
    if (!(error instanceof FirebaseAuthError) || !['EMAIL_NOT_FOUND', 'USER_DISABLED'].includes(error.code)) {
      throw error
    }
  }
}
