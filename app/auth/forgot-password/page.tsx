'use client'
// app/auth/forgot-password/page.tsx
// Step 1: enter email → verified against DB
// Step 2: enter + confirm new password → saved directly to DB

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Film, Mail, Eye, EyeOff, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground'

type Step = 'email' | 'inbox' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = (pw: string) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }
  const pwStrength = strength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][pwStrength]

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'check', email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else if (data.emailSent) {
        setStep('inbox')       // Resend path — email was sent
      } else {
        setStep('password')    // No email service — show password fields
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'reset', email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setStep('done')
        setTimeout(() => router.push('/auth/signin'), 2500)
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Film className="w-8 h-8 text-blue-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-yellow-200">
              {step === 'email'    && 'Enter the email on your account'}
              {step === 'inbox'    && `Reset link sent to ${email}`}
              {step === 'password' && `Setting new password for ${email}`}
              {step === 'done'     && 'All done!'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
          >
            {/* ── Step 1: Email ─────────────────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="block text-yellow-200 text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required disabled={isLoading}
                      placeholder="Enter your registered email"
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                  </div>
                </div>
                {error && <ErrorBox message={error} />}
                <SubmitButton loading={isLoading} disabled={!email} label="Continue" />
              </form>
            )}

            {/* ── Step inbox: email sent (Resend path) ─────────────────── */}
            {step === 'inbox' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">Check your inbox</h3>
                <p className="text-white/60 text-sm">
                  We sent a reset link to <span className="text-white font-medium">{email}</span>.
                  It expires in 1 hour.
                </p>
                <p className="text-white/40 text-xs">Didn't get it? Check your spam folder or{' '}
                  <button onClick={() => setStep('email')} className="text-yellow-300 hover:text-yellow-200 underline">try again</button>.
                </p>
              </motion.div>
            )}

            {/* ── Step 2: New password ──────────────────────────────────── */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-yellow-200 text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required minLength={8} disabled={isLoading}
                      placeholder="At least 8 characters"
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength ? strengthColor : 'bg-white/20'}`} />
                        ))}
                      </div>
                      <p className={`text-xs ${['','text-red-400','text-yellow-400','text-blue-400','text-green-400'][pwStrength]}`}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-yellow-200 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPw ? 'text' : 'password'} value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required minLength={8} disabled={isLoading}
                      placeholder="Repeat your password"
                      className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${confirm && password !== confirm ? 'border-red-500/60' : 'border-white/20'}`}
                    />
                  </div>
                  {confirm && password !== confirm && <p className="text-red-400 text-xs mt-1">Passwords don't match</p>}
                </div>

                {error && <ErrorBox message={error} />}
                <SubmitButton loading={isLoading} disabled={!password || !confirm || password !== confirm} label="Update Password" />
                <button type="button" onClick={() => { setStep('email'); setError('') }}
                  className="w-full text-white/50 hover:text-white text-sm transition-colors">
                  ← Use a different email
                </button>
              </form>
            )}

            {/* ── Done ─────────────────────────────────────────────────── */}
            {step === 'done' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">Password updated!</h3>
                <p className="text-white/60 text-sm">Redirecting you to sign in…</p>
                <Link href="/auth/signin"
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 font-bold py-2 px-6 rounded-lg text-sm">
                  Sign In Now
                </Link>
              </motion.div>
            )}

            {step !== 'done' && (
              <div className="mt-6 text-center">
                <Link href="/auth/signin" className="text-white/50 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-200 text-sm">{message}</p>
    </motion.div>
  )
}

function SubmitButton({ loading, disabled, label }: { loading: boolean; disabled: boolean; label: string }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
      disabled={loading || disabled}
      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2">
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full" />
        : label}
    </motion.button>
  )
}
