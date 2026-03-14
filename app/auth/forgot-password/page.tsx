'use client'
// app/auth/forgot-password/page.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Film, Mail, ArrowLeft, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; resetLink?: string } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative z-10">
      <div className="absolute inset-0 z-0">
        <YouTubeTrailerBackground autoplay muted showControls={false} loop className="w-full h-full" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-blue-900/60 via-orange-900/60 to-yellow-600/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Film className="w-8 h-8 text-blue-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
            <p className="text-yellow-200">We'll get you back into CineScope</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
          >
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-yellow-200 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Enter your registered email"
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full" />
                  ) : 'Send Reset Link'}
                </motion.button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Check your inbox</h3>
                  <p className="text-white/70 text-sm">{result.message}</p>
                </div>

                {/* If no email service — show the link directly so the flow still works */}
                {result.resetLink && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-left space-y-3">
                    <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wide">
                      No email service — use this link directly:
                    </p>
                    <Link
                      href={result.resetLink}
                      className="flex items-center gap-2 text-yellow-200 hover:text-yellow-100 text-sm break-all underline"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      Reset my password
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-white/60 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
