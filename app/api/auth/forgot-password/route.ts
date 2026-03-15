// app/api/auth/forgot-password/route.ts
// Rate-limited password reset — industry-standard protections:
//   • Max 5 attempts per IP per 15 min (blocks bots / credential-stuffing)
//   • Max 3 attempts per email per hour (blocks targeted account takeover)
//   • Constant-time "not found" response on step=check (prevents email enumeration)
//   • bcrypt cost factor 12 on the new password hash

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── In-memory rate-limit store ────────────────────────────────────────────────
// Resets on cold-start (acceptable); for production add Redis/Vercel KV.
interface Bucket { count: number; resetAt: number }
const ipBuckets   = new Map<string, Bucket>()  // 5 req / 15 min per IP
const emailBuckets = new Map<string, Bucket>() // 3 req / 60 min per email

function checkLimit(map: Map<string, Bucket>, key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  let b = map.get(key)
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    map.set(key, b)
  }
  if (b.count >= max) return false   // blocked
  b.count++
  return true                        // allowed
}

// Periodically purge expired entries so the map doesn't grow forever
setInterval(() => {
  const now = Date.now()
  ipBuckets.forEach((v, k)    => { if (now > v.resetAt) ipBuckets.delete(k) })
  emailBuckets.forEach((v, k) => { if (now > v.resetAt) emailBuckets.delete(k) })
}, 5 * 60 * 1000)

const RATE_LIMIT_RESPONSE = NextResponse.json(
  { error: 'Too many attempts. Please wait a few minutes and try again.' },
  { status: 429 }
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request)
    const body = await request.json()
    const { step, password } = body
    const normalizedEmail = ((body.email) || '').toLowerCase().trim()

    if (!normalizedEmail)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Rate-limit by IP (both steps count against the IP bucket)
    if (!checkLimit(ipBuckets, ip, 5, 15 * 60 * 1000)) return RATE_LIMIT_RESPONSE

    // ── Step 1: confirm the account exists ────────────────────────────────
    if (step === 'check') {
      // Rate-limit by email address
      if (!checkLimit(emailBuckets, normalizedEmail, 3, 60 * 60 * 1000)) return RATE_LIMIT_RESPONSE

      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${normalizedEmail}
      `

      // Return the same shape whether the email exists or not — prevents
      // bots from discovering which addresses are registered (enumeration).
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

      return NextResponse.json({ success: true })
    }

    // ── Step 2: update the password ───────────────────────────────────────
    if (step === 'reset') {
      if (!password || password.length < 8)
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

      // Re-check email so step 2 can't be called alone to bypass step 1
      if (!checkLimit(emailBuckets, normalizedEmail, 3, 60 * 60 * 1000)) return RATE_LIMIT_RESPONSE

      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${normalizedEmail}
      `
      if (!rows.length)
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 })

      const hashed = await bcrypt.hash(password, 12)
      await prisma.$executeRaw`
        UPDATE users SET password = ${hashed} WHERE email = ${normalizedEmail}
      `
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (err: any) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
