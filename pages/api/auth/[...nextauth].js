import NextAuth from "next-auth";
import Providers from "next-auth/providers";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.Credentials({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        const user = { id: 1, name: "J Smith", email: "jsmith@example.com" };

        if (user) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  // Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
  // https://next-auth.js.org/configuration/database
  database: process.env.DATABASE_URL,

  // The secret should be set to a reasonably long random string.
  // It is used to sign cookies and to create the signature for JSON Web Tokens
  secret: process.env.SECRET,

  // You can also use a credentials manager like Auth0, Google, GitHub, etc.
  // https://next-auth.js.org/configuration/providers
  callbacks: {
    // Getting the JWT token from API routes after successful login
    jwt: async (token, user, account, profile, isNewUser) => {
      // Persist the user ID to the token right after signin
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Getting the user object from the session
    session: async (session, token) => {
      // Add the user ID to the session
      session.user.id = token.id;
      return session;
    },
  },
});