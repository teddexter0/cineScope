// app/api/auth/[...nextauth]/route.ts - SIMPLIFIED WITHOUT PRISMA

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

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

          // Demo credentials (always works)
          if (credentials.email === "test@cinescope.com" && credentials.password === "password123") {
            console.log('✅ Demo user login successful')
            return {
              id: "demo-1",
              email: "test@cinescope.com",
              name: "Demo User",
            }
          }

          // For now, just demo mode. You can add real user logic later
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
    }
  }
})

export { handler as GET, handler as POST }