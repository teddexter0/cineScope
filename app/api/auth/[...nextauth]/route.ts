// app/api/auth/[...nextauth]/route.ts
// Auth config lives in lib/auth.ts so it can be shared with other server routes.

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
