// app/auth/signin/page.tsx
'use client'

import YouTubeTrailerBackground from '@/app/components/YouTubeTrailerBackground' 
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Better error messages
        if (result.error === 'CredentialsSignin') {
          setError('No account found with this email. Would you like to create one?')
        } else {
          setError('Invalid email or password. Please check your credentials.')
        }
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('test@cinescope.com')
    setPassword('password123')
    setError('')
  }

  return (

<div className="relative z-10"> 
    
<div className="absolute inset-0 z-0">
  <YouTubeTrailerBackground 
    autoplay={true}
    muted={true}
    showControls={false}
    loop={true}
    className="w-full h-full"
  />
</div>
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Film className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back to CineScope</h1>
          <p className="text-yellow-200">Your AI movie companion awaits</p>
        </motion.div>

        {/* Sign In Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-yellow-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-yellow-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 text-sm">{error}</p>
                  {error.includes('No account found') && (
                    <Link 
                      href="/auth/signup" 
                      className="text-yellow-300 hover:text-yellow-200 text-sm font-medium mt-2 inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Account Instead
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full"
                  />
                  Signing In...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Account Helper */}
          <div className="mt-6">
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
              <p className="text-blue-200 text-sm mb-3">
                <strong>Try the Demo Account:</strong>
              </p>
              <button
                onClick={fillDemoCredentials}
                className="w-full bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 py-2 px-4 rounded-lg text-sm transition-all"
              >
                Fill Demo Credentials
              </button>
              <p className="text-blue-300 text-xs mt-2">
                Email: test@cinescope.com<br />
                Password: password123
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-yellow-300 hover:text-yellow-200 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
</div>
  )
  }