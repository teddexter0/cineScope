'use client'
// app/auth/signin/page.tsx
// Fixed: email exists + wrong password → "Incorrect password", never "create account"

import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Film, Eye, EyeOff, Sparkles, AlertCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Step 1: check if email is registered
      let emailExists: boolean | null = null
      try {
        const check = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await check.json()
        // data.exists is true/false/null; data.dbError means we can't tell
        emailExists = (data.dbError || data.exists === null) ? null : data.exists
      } catch {
        emailExists = null
      }

      // Definite miss — don't even try to sign in
      if (emailExists === false) {
        setError('no-account')
        setIsLoading(false)
        return
      }

      // Step 2: attempt credentials sign-in
      const result = await signIn('credentials', { email, password, redirect: false })

      if (result?.ok) {
        router.push('/dashboard')
        return
      }

      // Sign-in failed.
      // If we confirmed the email EXISTS, it must be a wrong password.
      // If the email check was uncertain (null), still say wrong password
      // (because we tried and the server rejected the credentials — more
      // actionable than a generic error).
      setError('wrong-password')
    } catch {
      setError('unknown')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = () => { setEmail('test@cinescope.com'); setPassword('password123'); setError('') }

  return (
    <div className="relative z-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="absolute inset-0 z-0">
        <YouTubeTrailerBackground autoplay muted showControls={false} loop className="w-full h-full" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Film className="w-7 h-7 text-blue-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
              Welcome back
            </h1>
            <p className="text-yellow-200/70 text-sm">Your AI movie companion awaits</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl p-7 border border-white/15 shadow-2xl"
            style={{ background: 'rgba(10,8,22,0.82)', backdropFilter: 'blur(20px)' }}>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  disabled={isLoading}
                  className="w-full rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder="you@example.com" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/auth/forgot-password"
                    className="text-yellow-400/70 hover:text-yellow-300 text-xs transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required disabled={isLoading}
                    className="w-full rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    placeholder="Your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-3.5 flex items-start gap-3"
                  style={{
                    background: error === 'no-account' ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${error === 'no-account' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: error === 'no-account' ? '#60a5fa' : '#f87171' }} />
                  <div>
                    {error === 'no-account' && (
                      <>
                        <p className="text-blue-200 text-sm">No account found for <strong>{email}</strong></p>
                        <Link href={`/auth/signup?email=${encodeURIComponent(email)}`}
                          className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold mt-1.5 inline-flex items-center gap-1 transition-colors">
                          <UserPlus className="w-3.5 h-3.5" />
                          Create an account
                        </Link>
                      </>
                    )}
                    {error === 'wrong-password' && (
                      <>
                        <p className="text-red-200 text-sm">Incorrect password for <strong>{email}</strong></p>
                        <p className="text-white/40 text-xs mt-0.5">
                          <Link href="/auth/forgot-password" className="text-yellow-400 hover:text-yellow-300 transition-colors underline">
                            Reset your password
                          </Link>
                          {' '}if you&apos;ve forgotten it.
                        </p>
                      </>
                    )}
                    {error === 'unknown' && (
                      <p className="text-red-200 text-sm">Something went wrong — please try again.</p>
                    )}
                  </div>
                </motion.div>
              )}

              <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isLoading || !email || !password}
                className="w-full font-bold py-3 px-4 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                style={{
                  background: 'linear-gradient(135deg,#facc15,#f97316)',
                  color: '#1a0f00', letterSpacing: '-0.01em',
                  boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
                }}>
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full" />
                ) : (
                  <><Sparkles className="w-4 h-4" /> Sign In</>
                )}
              </motion.button>
            </form>

            {/* Demo */}
            <div className="mt-5 rounded-lg p-4 border border-blue-400/20"
              style={{ background: 'rgba(59,130,246,0.08)' }}>
              <p className="text-blue-200/70 text-xs mb-2.5 font-medium">Demo account</p>
              <button onClick={fillDemo}
                className="w-full py-2 rounded-lg text-sm font-medium text-blue-100 transition-all hover:bg-white/8"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Fill demo credentials
              </button>
              <p className="text-white/30 text-xs mt-2">test@cinescope.com · password123</p>
            </div>

            <p className="mt-5 text-center text-white/40 text-sm">
              No account?{' '}
              <Link href="/auth/signup" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
