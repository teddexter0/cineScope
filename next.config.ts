import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... other configurations ...
  auth: {
    secret: process.env.SECRET,
    pages: {
      signIn: '/api/auth/signin',
      signOut: '/api/auth/signout',
      error: '/api/auth/error',
    },
  },
};

export default nextConfig;