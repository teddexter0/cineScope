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
        // Simple demo authentication
        if (credentials?.email === "test@cinescope.com" && credentials?.password === "password123") {
          return {
            id: "1",
            email: "test@cinescope.com",
            name: "Test User",
          }
        }
        return null
      },
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }