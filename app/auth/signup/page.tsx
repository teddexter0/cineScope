// app/auth/signup/page.tsx - WITH PROPER EMAIL VALIDATION
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Film, Eye, EyeOff, User, Mail, AtSign, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// EMAIL VALIDATION UTILITIES
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const validateEmail = (email: string) => {
  if (!email) return { isValid: false, message: 'Email is required' }
  if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' }
  if (email.length > 254) return { isValid: false, message: 'Email is too long' }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (domain && !commonDomains.includes(domain) && domain.includes('.')) {
    // Suggest corrections for common typos
    if (domain.includes('gmail')) {
      return { isValid: false, message: 'Did you mean @gmail.com?' }
    }
    if (domain.includes('yahoo')) {
      return { isValid: false, message: 'Did you mean @yahoo.com?' }
    }
  }
  
  return { isValid: true, message: 'Valid email address' }
}

const validatePassword = (password: string) => {
  if (!password) return { isValid: false, message: 'Password is required' }
  if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters' }
  if (!/(?=.*[a-z])/.test(password)) return { isValid: false, message: 'Password must contain a lowercase letter' }
  if (!/(?=.*[A-Z])/.test(password)) return { isValid: false, message: 'Password must contain an uppercase letter' }
  if (!/(?=.*\d)/.test(password)) return { isValid: false, message: 'Password must contain a number' }
  
  return { isValid: true, message: 'Strong password' }
}

const validateUsername = (username: string) => {
  if (!username) return { isValid: false, message: 'Username is required' }
  if (username.length < 3) return { isValid: false, message: 'Username must be at least 3 characters' }
  if (username.length > 20) return { isValid: false, message: 'Username must be less than 20 characters' }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' }
  
  return { isValid: true, message: 'Valid username' }
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validations, setValidations] = useState<Record<string, { isValid: boolean; message: string }>>({})
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation
    let validation = { isValid: true, message: '' }
    
    if (name === 'email') {
      validation = validateEmail(value)
    } else if (name === 'password') {
      validation = validatePassword(value)
    } else if (name === 'username') {
      validation = validateUsername(value)
    } else if (name === 'name' && value.trim().length === 0) {
      validation = { isValid: false, message: 'Name is required' }
    }
    
    setValidations(prev => ({ ...prev, [name]: validation }))
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    
    const usernameValidation = validateUsername(formData.username)
    if (!usernameValidation.isValid) newErrors.username = usernameValidation.message
    
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) newErrors.email = emailValidation.message
    
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.message

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        if (data.error.includes('already exists')) {
          setErrors({ email: 'An account with this email already exists' })
        } else {
          setErrors({ general: data.error || 'Registration failed' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Success page
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/15 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md shadow-2xl"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to CineScope! 🎉</h2>
          <p className="text-white/80 mb-4">
            Your account has been created successfully. You can now sign in with your credentials.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-orange-600 transition-all"
          >
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 p-4 flex items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join CineScope</h1>
          <p className="text-yellow-200">Start your personalized movie journey</p>
        </motion.div>

        {/* Sign Up Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/15 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-yellow-200 text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                <User className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-yellow-200 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    validations.username?.isValid === false ? 'border-red-400 focus:ring-red-400' :
                    validations.username?.isValid ? 'border-green-400 focus:ring-green-400' :
                    'border-white/30 focus:ring-yellow-400'
                  }`}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
                <AtSign className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {validations.username?.isValid && (
                  <CheckCircle className="w-5 h-5 text-green-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
              </div>
              {validations.username && (
                <p className={`text-sm mt-1 flex items-center gap-1 ${
                  validations.username.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validations.username.isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {validations.username.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-yellow-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    validations.email?.isValid === false ? 'border-red-400 focus:ring-red-400' :
                    validations.email?.isValid ? 'border-green-400 focus:ring-green-400' :
                    'border-white/30 focus:ring-yellow-400'
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                <Mail className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {validations.email?.isValid && (
                  <CheckCircle className="w-5 h-5 text-green-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
              </div>
              {validations.email && (
                <p className={`text-sm mt-1 flex items-center gap-1 ${
                  validations.email.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validations.email.isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {validations.email.message}
                </p>
              )}
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-yellow-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    validations.password?.isValid === false ? 'border-red-400 focus:ring-red-400' :
                    validations.password?.isValid ? 'border-green-400 focus:ring-green-400' :
                    'border-white/30 focus:ring-yellow-400'
                  }`}
                  placeholder="Create a strong password"
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
              {validations.password && (
                <p className={`text-sm mt-1 flex items-center gap-1 ${
                  validations.password.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validations.password.isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {validations.password.message}
                </p>
              )}
            </div>

            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || Object.values(validations).some(v => v.isValid === false)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Account
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-yellow-300 hover:text-yellow-200 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}