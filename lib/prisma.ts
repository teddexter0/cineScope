// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { withFirestore } from './firestore-store'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const legacy = globalForPrisma.prisma ?? new PrismaClient()
export const prisma = withFirestore(legacy)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = legacy
