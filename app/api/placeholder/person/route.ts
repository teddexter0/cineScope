// app/api/placeholder/person/route.ts - Simple placeholder image generator

import { NextResponse } from 'next/server'

export async function GET() {
  // Create a simple SVG without emojis
  const svg = `
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill="url(#grad)"/>
      <circle cx="100" cy="80" r="25" fill="white" opacity="0.8"/>
      <rect x="75" y="120" width="50" height="80" rx="25" fill="white" opacity="0.8"/>
      <text x="100" y="220" text-anchor="middle" fill="white" font-size="12" font-family="Arial">No Photo</text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    },
  })
}