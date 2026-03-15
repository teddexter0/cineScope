// app/layout.tsx - FIXED WITH SESSION PROVIDER
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "./components/SessionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineScope - Your AI Movie Companion",
  description: "Discover your next favorite movie with AI-powered personalized recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}