// Update your app/layout.tsx to handle loading better

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
