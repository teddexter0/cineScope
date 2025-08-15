'use client'

import { useState } from 'react'
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

const questions: Question[] = [
  {
    id: 1,
    question: "What's the last movie that completely captivated you?",
    subtitle: "Just the movie title first",
    type: 'movie-search',
    placeholder: 'e.g., Inception, The Matrix, Parasite...'
  },
  {
    id: 2,
    question: "Now tell us WHY it captivated you",
    subtitle: "Just say whatever comes to mind - be honest!",
    type: 'text',
    maxLength: 300,
    placeholder: 'The plot twists, the cinematography, how it made me feel...'
  },
  {
    id: 3,
    question: "Which movie character do you relate to most?",
    subtitle: "Any character from any movie/series",
    type: 'text',
    maxLength: 200,
    placeholder: 'Tony Stark, Hermione Granger, Walter White...'
  },
  {
    id: 4,
    question: "Why do you connect with this character?",
    subtitle: "What about them speaks to you?",
    type: 'text',
    maxLength: 250,
    placeholder: 'Their struggles, personality, journey, flaws...'
  },
  {
    id: 5,
    question: "Who's your favorite director?",
    subtitle: "The filmmaker whose style you love most",
    type: 'director-search',
    placeholder: 'Christopher Nolan, Greta Gerwig, Jordan Peele...'
  },
  {
    id: 6,
    question: "What mood are you usually in when you want to watch something?",
    type: 'select',
    options: [
      '😌 Relaxed & want comfort',
      '⚡ Energetic & want excitement', 
      '🤔 Thoughtful & want depth',
      '🚀 Adventurous & want thrills',
      '💕 Romantic & want feels',
      '😂 Playful & want laughs',
      '🌙 Late night & want atmosphere'
    ]
  },
  {
    id: 7,
    question: "Pick your perfect movie night scenario",
    type: 'select',
    options: [
      '🍿 Blockbuster with friends & snacks',
      '🏠 Cozy solo night with comfort films',
      '💑 Date night with romantic movies',
      '👨‍👩‍👧‍👦 Family time with feel-good films',
      '🧠 Mind-bending films that challenge me',
      '😱 Horror nights for adrenaline',
      '🎭 Art house films for deep thoughts'
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
      [questions[currentQuestion].id]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Store answers in localStorage for now
    localStorage.setItem('onboardingAnswers', JSON.stringify(answers))
    localStorage.setItem('onboardingCompleted', 'true')
    
    router.push('/dashboard')
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id] || ''
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Movie Film Strip Effect */}
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between text-white/60 text-sm mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 h-3 rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20 shadow-2xl"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 leading-relaxed">
              {question.question}
            </h2>
            {question.subtitle && (
              <p className="text-purple-200 text-sm opacity-80">
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
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <div className="text-right text-white/40 text-xs mt-1">
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
              className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          )}

          {/* Select Options */}
          {question.type === 'select' && (
            <div className="space-y-3">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-lg border transition-all text-left group hover:scale-[1.02] ${
                    currentAnswer === option
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{option.split(' ')[0]}</span>
                    <span className="flex-1">{option.split(' ').slice(1).join(' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentAnswer || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/25"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  🧠 AI is analyzing your personality...
                </>
              ) : currentQuestion === questions.length - 1 ? (
                '✨ Complete My CineScope Profile'
              ) : (
                'Next →'
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
            <h1 className="text-4xl font-bold text-white mb-4">
              🎬 Welcome to CineScope!
            </h1>
            <p className="text-purple-200 text-lg leading-relaxed">
              Let's build your movie DNA so we can recommend films that'll blow your mind. 
              <br />
              <span className="text-sm opacity-75">This takes 2 minutes and creates magic ✨</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}