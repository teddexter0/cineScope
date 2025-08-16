// app/api/auth/[...nextauth]/route.ts - FIXED PRISMA SETUP

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Proper Prisma initialization
let prisma: any

try {
  // Try to import Prisma client
  const { PrismaClient } = require('@prisma/client')
  
  // Use global instance in development to prevent multiple connections
  const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
  }
  
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
  
  console.log('✅ Prisma client initialized successfully')
} catch (error) {
  console.error('❌ Prisma client initialization failed:', error)
  prisma = null
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log('🔐 Attempting login for:', credentials.email)

          // Check demo credentials first (always works)
          if (credentials.email === "test@cinescope.com" && credentials.password === "password123") {
            console.log('✅ Demo user login successful')
            return {
              id: "demo-1",
              email: "test@cinescope.com",
              name: "Demo User",
            }
          }

          // Only try database if Prisma is available
          if (prisma) {
            try {
              const user = await prisma.user.findUnique({
                where: { email: credentials.email }
              })

              console.log('👤 Database user found:', user ? 'Yes' : 'No')

              if (user && user.password) {
                // Check password
                const passwordsMatch = await bcrypt.compare(credentials.password, user.password)
                console.log('🔑 Password match:', passwordsMatch)

                if (passwordsMatch) {
                  console.log('✅ Database user login successful')
                  return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                  }
                }
              }
            } catch (dbError) {
              console.error('❌ Database query error:', dbError)
              // Fall through to demo mode if database fails
            }
          } else {
            console.log('⚠️ Database unavailable, only demo login works')
          }

          console.log('❌ Login failed for:', credentials.email)
          return null

        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      },
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: { 
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  // Add error handling
  events: {
    async signIn({ user, account, profile }) {
      console.log('✅ Sign in event:', user.email)
    },
    async signOut({ session, token }) {
      console.log('👋 Sign out event')
    },
    async createUser({ user }) {
      console.log('👤 User created:', user.email)
    },
    async session({ session, token }) {
      // console.log('📅 Session accessed:', session.user?.email)
    }
  }
})

export { handler as GET, handler as POST }