// app/api/auth/reset-password/route.ts
// Kept for backwards compatibility — the active reset flow now lives entirely
// in /api/auth/forgot-password (2-step: check email → update password).
// This route is no longer used but is left here to avoid 404s on any old links.

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use /auth/forgot-password to reset your password.' },
    { status: 410 }
  )
}
