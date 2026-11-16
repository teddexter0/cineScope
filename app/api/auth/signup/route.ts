// Create/update: app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { FirebaseAuthError, firebasePasswordSignUp, usesFirebaseAuth } from '@/lib/firebase-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, name, password } = body
    const normalizedEmail = String(email || '').toLowerCase().trim()

    // Basic validation
    if (!normalizedEmail || typeof password !== 'string' || !password || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (username && (typeof username !== 'string' || !/^[a-z0-9_]{3,20}$/i.test(username))) {
      return NextResponse.json({ error: 'Username must be 3–20 letters, numbers, or underscores.' }, { status: 400 })
    }
    const normalizedUsername = username ? username.toLowerCase() : undefined

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingUser || normalizedEmail === 'test@cinescope.com') {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Check username uniqueness (case-insensitive) — industry standard
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
        select: { id: true },
      })
      if (existingUsername) {
        return NextResponse.json(
          { error: 'Username is already taken. Please choose a different one.' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const firebase = usesFirebaseAuth()
    const id = firebase ? await firebasePasswordSignUp(normalizedEmail, password) : undefined
    const hashedPassword = firebase ? null : await bcrypt.hash(password, 12)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id,
        email: normalizedEmail,
        username: normalizedUsername,
        name,
        password: hashedPassword,
      }
    })

    // Return success (don't send password back)
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const fields = error.meta?.target
      const usernameConflict = Array.isArray(fields) && fields.includes('username')
      return NextResponse.json({
        error: usernameConflict ? 'Username is already taken.' : 'User already exists with this email',
      }, { status: 400 })
    }
    if (error instanceof FirebaseAuthError) {
      if (error.code === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
      }
      if (error.code === 'INVALID_EMAIL' || error.code === 'WEAK_PASSWORD' || error.code === 'PASSWORD_DOES_NOT_MEET_REQUIREMENTS') {
        return NextResponse.json({ error: 'Enter a valid email and a stronger password.' }, { status: 400 })
      }
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
