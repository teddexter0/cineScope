// app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Question {
  id: number
  question: string
  subtitle?: string
  type: 'text' | 'select' | 'multi-select' | 'slider'
  options?: string[]
  maxLength?: number
  placeholder?: string
  sliderLabels?: [string, string]
  minSelect?: number
  maxSelect?: number
}

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
    question: "Which genres do you enjoy most? Pick as many as apply.",
    subtitle: "Select everything that feels like you 🎪",
    type: 'multi-select',
    minSelect: 1,
    maxSelect: 5,
    options: [
      '🎬 Drama',
      '😂 Comedy',
      '💥 Action',
      '❤️ Romance',
      '👻 Horror / Thriller',
      '🚀 Sci-Fi / Fantasy',
      '🕵️ Mystery / Crime',
      '🌍 Documentary',
      '🎭 Animation',
      '🏰 Historical / Period'
    ]
  },
  {
    id: 3,
    question: "What kind of story do you reach for?",
    subtitle: "Drag the slider to where you naturally land 🧠",
    type: 'slider',
    sliderLabels: ['Something comforting & familiar', 'Something that challenges & surprises me']
  },
  {
    id: 4,
    question: "What moods match your typical watch sessions? Pick all that fit.",
    subtitle: "You can pick more than one — moods are complicated 🌟",
    type: 'multi-select',
    minSelect: 1,
    maxSelect: 4,
    options: [
      '😌 Relaxed, want to unwind',
      '⚡ Hyped, want excitement',
      '🤔 Reflective, want something deep',
      '🚀 Adventurous, want thrills',
      '💕 Sentimental, want the feels',
      '😂 Playful, want to laugh',
      '😴 Low energy, want easy watching'
    ]
  },
  {
    id: 5,
    question: "What draws you into a film most?",
    subtitle: "Pick your top priority — or the one you miss most when it's gone 🎯",
    type: 'select',
    options: [
      '🎭 Outstanding acting performances',
      '📖 Incredible plot and storytelling',
      '🎥 Beautiful visuals and cinematography',
      '🎵 Immersive soundtrack',
      '⚙️ Original concept or world-building',
      '⚖️ All of it working together'
    ]
  },
  {
    id: 6,
    question: "How much does pace matter to you?",
    subtitle: "Slow burn vs non-stop — where's your sweet spot? ⏱️",
    type: 'slider',
    sliderLabels: ['Slow, atmospheric & meditative', 'Fast-paced, punchy & relentless']
  },
  {
    id: 7,
    question: "Who are your favourite actors or directors?",
    subtitle: "Names you always follow, even if you don't know why 🌟",
    type: 'text',
    maxLength: 200,
    placeholder: 'e.g. Denis Villeneuve, Cate Blanchett, Bong Joon-ho...'
  },
  {
    id: 8,
    question: "What makes you bail on a movie?",
    subtitle: "Pick everything that kills your vibe — we'll steer clear ⛔",
    type: 'multi-select',
    minSelect: 1,
    maxSelect: 4,
    options: [
      '😴 Too slow or boring',
      '🤯 Too confusing or convoluted',
      '😱 Too graphic or violent',
      '😬 Weak acting or cringe dialogue',
      '🎭 Plot that feels dumb or unbelievable',
      '⏰ Just too long',
      '🔮 Too predictable / no surprises',
      '😭 Too emotionally heavy'
    ]
  }
]

type Answer = string | string[] | number

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const question = onboardingQuestions[currentQuestion]
  const currentAnswer = answers[question.id]
  const progress = ((currentQuestion + 1) / onboardingQuestions.length) * 100

  const isAnswered = () => {
    if (question.type === 'multi-select') {
      const arr = currentAnswer as string[] | undefined
      return Array.isArray(arr) && arr.length >= (question.minSelect ?? 1)
    }
    if (question.type === 'slider') {
      return currentAnswer !== undefined
    }
    return !!currentAnswer
  }

  const handleTextAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
  }

  const handleSelectAnswer = (option: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: option }))
  }

  const handleMultiSelectToggle = (option: string) => {
    const current = (answers[question.id] as string[]) || []
    const max = question.maxSelect ?? 99
    if (current.includes(option)) {
      setAnswers(prev => ({ ...prev, [question.id]: current.filter(o => o !== option) }))
    } else if (current.length < max) {
      setAnswers(prev => ({ ...prev, [question.id]: [...current, option] }))
    }
  }

  const handleSliderAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
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
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers))
      localStorage.setItem('onboardingCompleted', 'true')
      await new Promise(resolve => setTimeout(resolve, 3000))
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const sliderValue = typeof currentAnswer === 'number' ? currentAnswer : 50

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-orange-900 to-yellow-600 p-4 flex items-center justify-center relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-2xl w-full relative z-10">

        {/* Progress bar */}
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
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 h-4 rounded-full relative shadow-lg"
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
            </motion.div>
          </div>
        </motion.div>

        {/* Question card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
            {question.type === 'multi-select' && (
              <p className="text-white/50 text-sm mt-1">
                {Array.isArray(currentAnswer) ? currentAnswer.length : 0} selected
                {question.maxSelect ? ` · up to ${question.maxSelect}` : ''}
              </p>
            )}
          </div>

          {/* TEXT */}
          {question.type === 'text' && (
            <div>
              <textarea
                value={(currentAnswer as string) || ''}
                onChange={e => handleTextAnswer(e.target.value)}
                placeholder={question.placeholder}
                maxLength={question.maxLength}
                className="w-full bg-white/10 border border-white/30 rounded-2xl p-6 text-white placeholder-white/60 min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-lg"
              />
              <div className="text-right text-white/50 text-sm mt-2 font-medium">
                {((currentAnswer as string) || '').length}/{question.maxLength}
              </div>
            </div>
          )}

          {/* SINGLE SELECT */}
          {question.type === 'select' && (
            <div className="space-y-3">
              {question.options?.map(option => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left group hover:scale-[1.02] transform duration-200 ${
                    currentAnswer === option
                      ? 'bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-yellow-400 text-white shadow-xl scale-[1.02]'
                      : 'bg-white/5 border-white/30 text-white/90 hover:bg-white/15 hover:border-white/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{option.split(' ')[0]}</span>
                    <span className="flex-1 text-base font-medium">{option.split(' ').slice(1).join(' ')}</span>
                    {currentAnswer === option && <span className="text-yellow-300 text-xl">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* MULTI SELECT */}
          {question.type === 'multi-select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options?.map(option => {
                const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option)
                const atMax = Array.isArray(currentAnswer) && currentAnswer.length >= (question.maxSelect ?? 99)
                return (
                  <button
                    key={option}
                    onClick={() => handleMultiSelectToggle(option)}
                    disabled={!selected && atMax}
                    className={`p-4 rounded-2xl border transition-all text-left duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-yellow-400 text-white shadow-lg scale-[1.02]'
                        : atMax
                        ? 'bg-white/3 border-white/15 text-white/30 cursor-not-allowed'
                        : 'bg-white/5 border-white/30 text-white/90 hover:bg-white/15 hover:border-white/50 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{option.split(' ')[0]}</span>
                      <span className="flex-1 text-sm font-medium leading-tight">{option.split(' ').slice(1).join(' ')}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? 'border-yellow-400 bg-yellow-400' : 'border-white/40'
                      }`}>
                        {selected && <span className="text-blue-900 text-xs font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* SLIDER */}
          {question.type === 'slider' && (
            <div className="py-4">
              <div className="relative mb-6">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderValue}
                  onChange={e => handleSliderAnswer(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #facc15 0%, #f97316 ${sliderValue}%, rgba(255,255,255,0.2) ${sliderValue}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              <div className="flex justify-between items-start gap-4">
                <div className={`flex-1 text-sm leading-snug text-left transition-all ${sliderValue < 40 ? 'text-yellow-300 font-semibold' : 'text-white/50'}`}>
                  {question.sliderLabels?.[0]}
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-blue-900 font-bold text-sm">{sliderValue}</span>
                </div>
                <div className={`flex-1 text-sm leading-snug text-right transition-all ${sliderValue > 60 ? 'text-yellow-300 font-semibold' : 'text-white/50'}`}>
                  {question.sliderLabels?.[1]}
                </div>
              </div>

              {/* Visual ticks */}
              <div className="flex justify-between mt-2 px-1">
                {['Pure comfort', 'Balanced', 'Full challenge'].map((label, i) => (
                  <span key={label} className="text-white/30 text-xs">{label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Nav buttons */}
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
              disabled={!isAnswered() || isLoading}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-10 py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
                  🧠 Analysing your movie DNA...
                </>
              ) : currentQuestion === onboardingQuestions.length - 1 ? (
                <>
                  <span className="text-2xl">✨</span>
                  Complete My CineScope Profile
                </>
              ) : (
                <>Next <span className="text-xl">→</span></>
              )}
            </button>
          </div>
        </motion.div>

        {/* Welcome blurb on Q1 */}
        {currentQuestion === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">🎬 Welcome to CineScope!</h1>
            <p className="text-yellow-200 text-xl leading-relaxed">
              Let's build your movie DNA so we can recommend films that'll blow your mind.
              <br />
              <span className="text-lg opacity-80 font-medium">This takes 2 minutes and creates magic ✨</span>
            </p>
          </motion.div>
        )}

        {/* Dot progress indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-3 mt-8"
        >
          {onboardingQuestions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index <= currentQuestion ? 'bg-yellow-400 scale-125 shadow-lg' : 'bg-white/30'
              }`}
            />
          ))}
        </motion.div>

        {/* Loading overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 border-4 border-white border-t-transparent rounded-full mx-auto mb-8"
              />
              <h3 className="text-3xl font-bold text-white mb-4">🧠 AI is Learning Your Taste</h3>
              <div className="space-y-3 text-white/90">
                {[
                  { color: 'bg-green-400', label: 'Analysing your personality...' },
                  { color: 'bg-yellow-400', label: 'Mapping your preferences...' },
                  { color: 'bg-blue-400', label: 'Preparing recommendations...' }
                ].map(({ color, label }, i) => (
                  <div key={label} className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
                      className={`w-3 h-3 ${color} rounded-full`}
                    />
                    <span>{label}</span>
                  </div>
                ))}
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
