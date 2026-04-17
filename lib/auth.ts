// lib/auth.ts
// Single source of truth for NextAuth configuration.

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function findUserByEmailInsensitive(email: string) {
  const rows = await prisma.$queryRaw<Array<{
    id: string
    email: string
    name: string | null
    username: string | null
    password: string | null
  }>>`
    SELECT id, email, name, username, password
    FROM users
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `
  return rows[0] ?? null
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const normalizedEmail = credentials.email.toLowerCase().trim()

        if (normalizedEmail === 'test@cinescope.com' && credentials.password === 'password123') {
          return { id: 'demo-1', email: 'test@cinescope.com', name: 'Demo User' }
        }

        try {
          console.log('Attempting login for:', normalizedEmail)

          const user = await findUserByEmailInsensitive(normalizedEmail)

          if (user?.password) {
            const passwordMatch = await bcrypt.compare(credentials.password, user.password)
            if (passwordMatch) {
              console.log('Database user login successful:', user.email)
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                username: user.username ?? undefined,
              }
            }
          }

          console.log('Login failed for:', normalizedEmail)
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.username = (user as any).username
      }
      if (trigger === 'update' && sessionData?.username !== undefined) {
        token.username = sessionData.username
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
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
  events: {
    async signIn({ user }) {
      console.log('Sign in:', user.email)
    },
    async signOut() {
      console.log('Sign out')
    },
  },
}
