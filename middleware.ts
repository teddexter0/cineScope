import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // Check if user is authenticated
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    const url = req.url.replace(req.nextUrl.pathname, '/auth/signin')
    return Response.redirect(url)
  }

  // Check if user is authenticated and trying to access auth pages
  if (req.auth && (req.nextUrl.pathname.startsWith('/auth'))) {
    const url = req.url.replace(req.nextUrl.pathname, '/dashboard')
    return Response.redirect(url)
  }

  // Check if user completed onboarding
  if (req.auth && req.nextUrl.pathname === '/dashboard') {
    // You could add logic here to check onboarding status
    // and redirect to /onboarding if not completed
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}