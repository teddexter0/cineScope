// app/api/auth/[...nextauth]/route.ts - FIXED TO USE DATABASE

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

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

          // FIXED: Check database for real users first
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user && user.password) {
            // Verify password with bcrypt
            const passwordMatch = await bcrypt.compare(credentials.password, user.password)
            
            if (passwordMatch) {
              console.log('✅ Database user login successful:', user.email)
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                username: user.username ?? undefined,
              }
            }
          }

          // Fallback: Demo credentials (keep this for testing)
          if (credentials.email === "test@cinescope.com" && credentials.password === "password123") {
            console.log('✅ Demo user login successful')
            return {
              id: "demo-1",
              email: "test@cinescope.com",
              name: "Demo User",
            }
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
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.username = token.username as string | undefined
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
    }
  }
})

export { handler as GET, handler as POST }