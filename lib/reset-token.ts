import crypto from 'crypto'

const TTL = 60 * 60 * 1000

export function makeResetToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Password reset is not configured')
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + TTL })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return null
    const dot = token.lastIndexOf('.')
    if (dot < 0) return null

    const payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')

    if (sig.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'ascii'), Buffer.from(expected, 'ascii'))) return null

    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!email || !exp || Date.now() > exp) return null

    return { email }
  } catch {
    return null
  }
}
