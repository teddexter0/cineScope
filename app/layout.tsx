import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineScope - Your AI Movie Companion",
  description: "Discover your next favorite movie with AI-powered personalized recommendations",
  keywords: "movies, AI, recommendations, personalized, cinema, entertainment",
  authors: [{ name: "CineScope Team" }],
  openGraph: {
    title: "CineScope - Your AI Movie Companion",
    description: "Discover your next favorite movie with AI-powered personalized recommendations",
    type: "website",
    url: "https://cinescope.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineScope - Your AI Movie Companion",
    description: "Discover your next favorite movie with AI-powered personalized recommendations",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}