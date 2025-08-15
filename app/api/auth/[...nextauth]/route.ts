// Fix app/api/auth/[...nextauth]/route.ts - Make it handle real users properly

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
          console.log('Attempting login for:', credentials.email)

          // Check demo credentials first
          if (credentials.email === "test@cinescope.com" && credentials.password === "password123") {
            return {
              id: "demo-1",
              email: "test@cinescope.com",
              name: "Demo User",
            }
          }

          // Check real users in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('Found user:', user ? 'Yes' : 'No')

          if (!user || !user.password) {
            console.log('User not found or no password')
            return null
          }

          // Check password
          const passwordsMatch = await bcrypt.compare(credentials.password, user.password)
          console.log('Password match:', passwordsMatch)

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }
        } catch (error) {
          console.error("Auth error:", error)
        }

        return null
      },
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  debug: true, // Add this to see what's happening
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
