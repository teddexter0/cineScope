import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Simple signup without Prisma for now
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // For now, just return success (we'll add database later)
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully (demo mode)' 
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}