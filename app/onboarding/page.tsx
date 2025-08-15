'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Question {
  id: number
  question: string
  type: 'text' | 'select' | 'multiselect'
  options?: string[]
}

const questions: Question[] = [
  {
    id: 1,
    question: "What's the last movie that completely captivated you and why?",
    type: 'text'
  },
  {
    id: 2,
    question: "What's your favorite movie genre?",
    type: 'select',
    options: ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller']
  },
  {
    id: 3,
    question: "Which character from any movie do you relate to most?",
    type: 'text'
  },
  {
    id: 4,
    question: "What mood are you usually in when you want to watch something?",
    type: 'select',
    options: ['Relaxed', 'Energetic', 'Thoughtful', 'Adventurous', 'Romantic']
  },
  {
    id: 5,
    question: "Do you prefer stories that challenge you or comfort you?",
    type: 'select',
    options: ['Challenge me', 'Comfort me', 'Both equally', 'Depends on my mood']
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Store answers in localStorage for now
    localStorage.setItem('onboardingAnswers', JSON.stringify(answers))
    localStorage.setItem('onboardingCompleted', 'true')
    
    router.push('/dashboard')
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id] || ''
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
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
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">
            {question.question}
          </h2>

          {question.type === 'text' && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          )}

          {question.type === 'select' && (
            <div className="space-y-3">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    currentAnswer === option
                      ? 'bg-purple-500/30 border-purple-400 text-white'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentAnswer || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : currentQuestion === questions.length - 1 ? (
                'Complete Setup'
              ) : (
                'Next'
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
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to CineScope! 🎬
            </h1>
            <p className="text-purple-200 text-lg">
              Let's get to know your movie preferences so we can recommend the perfect films for you.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}