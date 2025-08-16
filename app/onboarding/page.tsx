// app/onboarding/page.tsx - COMPLETE FIXED VERSION
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Question {
  id: number
  question: string
  subtitle?: string
  type: 'text' | 'select' | 'movie-search' | 'director-search'
  options?: string[]
  maxLength?: number
  placeholder?: string
}

// EXACTLY 8 QUESTIONS - FIXED!
const onboardingQuestions: Question[] = [
  {
    id: 1,
    question: "What's the last movie that completely captivated you and why?",
    subtitle: "Tell us about a film that really grabbed your attention 🎬",
    type: 'text',
    maxLength: 300,
    placeholder: 'The movie and what made it special to you...'
  },
  {
    id: 2,
    question: "Which character from any movie do you relate to most?",
    subtitle: "Think about characters that feel real or relatable 🎭",
    type: 'text',
    maxLength: 200,
    placeholder: 'Character name and why you connect with them...'
  },
  {
    id: 3,
    question: "What mood are you usually in when you want to watch something?",
    subtitle: "Your typical viewing mindset 🌟",
    type: 'select',
    options: [
      '😌 Relaxed and want comfort',
      '⚡ Energetic and want excitement', 
      '🤔 Thoughtful and want depth',
      '🚀 Adventurous and want thrills',
      '💕 Romantic and want feels',
      '😂 Playful and want laughs'
    ]
  },
  {
    id: 4,
    question: "Do you prefer stories that challenge you or comfort you?",
    subtitle: "Your preference for narrative complexity 🧠",
    type: 'select',
    options: [
      '🧠 Challenge me with complex plots',
      '😌 Comfort me with familiar stories',
      '⚖️ A good balance of both',
      '🎲 Surprise me with something different'
    ]
  },
  {
    id: 5,
    question: "What's more important to you: great acting or an amazing plot?",
    subtitle: "What draws you in most? 🎯",
    type: 'select',
    options: [
      '🎭 Outstanding acting performances',
      '📖 Incredible plot and storytelling',
      '🎥 Amazing visuals and cinematography',
      '🎵 Great soundtrack and audio',
      '⚖️ All elements working together'
    ]
  },
  {
    id: 6,
    question: "What genre do you find yourself watching most often?",
    subtitle: "Your go-to movie category 🎪",
    type: 'select',
    options: [
      '🎬 Drama',
      '😂 Comedy',
      '💥 Action',
      '❤️ Romance',
      '👻 Horror/Thriller',
      '🚀 Sci-Fi/Fantasy',
      '🕵️ Mystery/Crime',
      '🌍 Documentary'
    ]
  },
  {
    id: 7,
    question: "Who are your top 3 favorite actors or directors?",
    subtitle: "The talent you always watch 🌟",
    type: 'text',
    maxLength: 200,
    placeholder: 'List your favorite actors, directors, or creators...'
  },
  {
    id: 8,
    question: "What makes you stop watching a movie?",
    subtitle: "Your biggest movie dealbreakers ⛔",
    type: 'select',
    options: [
      '😴 Too slow or boring',
      '🤯 Too confusing or complex',
      '😱 Too violent or intense',
      '😬 Bad acting or dialogue',
      '🎭 Unrealistic or silly plot',
      '⏰ Just too long'
    ]
  }
]

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [onboardingQuestions[currentQuestion].id]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestion < onboardingQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Save to localStorage 
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers))
      localStorage.setItem('onboardingCompleted', 'true')
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const question = onboardingQuestions[currentQuestion]
  const currentAnswer = answers[question.id] || ''
  const progress = ((currentQuestion + 1) / onboardingQuestions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 p-4 flex items-center justify-center relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Movie Film Strip Effect */}
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* FIXED Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between text-white/80 text-base mb-3">
            <span className="font-medium">Question {currentQuestion + 1} of {onboardingQuestions.length}</span>
            <span className="font-bold">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 h-4 rounded-full relative shadow-lg"
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-6 border border-white/30 shadow-2xl"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3 leading-relaxed">
              {question.question}
            </h2>
            {question.subtitle && (
              <p className="text-yellow-200 text-base opacity-90 font-medium">
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Text Input */}
          {question.type === 'text' && (
            <div>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={question.placeholder}
                maxLength={question.maxLength}
                className="w-full bg-white/10 border border-white/30 rounded-2xl p-6 text-white placeholder-white/60 min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-lg"
              />
              <div className="text-right text-white/50 text-sm mt-2 font-medium">
                {currentAnswer.length}/{question.maxLength}
              </div>
            </div>
          )}

          {/* Movie/Director Search */}
          {(question.type === 'movie-search' || question.type === 'director-search') && (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full bg-white/10 border border-white/30 rounded-2xl p-6 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-lg"
            />
          )}

          {/* Select Options */}
          {question.type === 'select' && (
            <div className="space-y-4">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-6 rounded-2xl border transition-all text-left group hover:scale-[1.02] transform duration-300 ${
                    currentAnswer === option
                      ? 'bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-yellow-400 text-white shadow-xl scale-[1.02]'
                      : 'bg-white/5 border-white/30 text-white/90 hover:bg-white/15 hover:border-white/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{option.split(' ')[0]}</span>
                    <span className="flex-1 text-lg font-medium">{option.split(' ').slice(1).join(' ')}</span>
                    {currentAnswer === option && (
                      <span className="text-yellow-300 text-xl">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-10">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-8 py-3 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium text-lg"
            >
              ← Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentAnswer || isLoading}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-10 py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  🧠 AI is analyzing your movie DNA...
                </>
              ) : currentQuestion === onboardingQuestions.length - 1 ? (
                <>
                  <span className="text-2xl">✨</span>
                  Complete My CineScope Profile
                </>
              ) : (
                <>
                  Next
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Welcome Message */}
        {currentQuestion === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-6">
              🎬 Welcome to CineScope!
            </h1>
            <p className="text-yellow-200 text-xl leading-relaxed">
              Let's build your movie DNA so we can recommend films that'll blow your mind. 
              <br />
              <span className="text-lg opacity-80 font-medium">This takes 2 minutes and creates magic ✨</span>
            </p>
          </motion.div>
        )}

        {/* Progress Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-3 mt-8"
        >
          {onboardingQuestions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index <= currentQuestion
                  ? 'bg-yellow-400 scale-125 shadow-lg'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </motion.div>

        {/* Completion Animation */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-white border-t-transparent rounded-full mx-auto mb-8"
              />
              
              <h3 className="text-3xl font-bold text-white mb-4">
                🧠 AI is Learning Your Taste
              </h3>
              
              <div className="space-y-3 text-white/90">
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 bg-green-400 rounded-full"
                  />
                  <span>Analyzing your personality...</span>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    className="w-3 h-3 bg-yellow-400 rounded-full"
                  />
                  <span>Mapping your movie preferences...</span>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 1 }}
                    className="w-3 h-3 bg-blue-400 rounded-full"
                  />
                  <span>Preparing personalized recommendations...</span>
                </div>
              </div>
              
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white/80 mt-6 text-lg"
              >
                Creating your unique movie DNA...
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Add debounce function for search functionality
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}