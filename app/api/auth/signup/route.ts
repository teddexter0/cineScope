// Create/update: app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, name, password } = body

    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
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
    const hashedPassword = await bcrypt.hash(password, 12)

    // Normalise username to lowercase for consistent case-insensitive uniqueness
    const normalizedUsername = username ? username.toLowerCase() : undefined

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
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
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
