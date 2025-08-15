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

// Enhanced onboarding questions with multiple answers and better AI analysis

export const enhancedOnboardingQuestions = [
  {
    id: 1,
    question: "What are your TOP 3 favorite movies of all time?",
    subtitle: "List up to 3 movies that you absolutely love 🎬",
    type: 'multiple-movie-search',
    maxAnswers: 3,
    placeholder: 'Search for movies...',
    hint: "These help us understand your core taste!"
  },
  {
    id: 2,
    question: "Why do these movies resonate with you?",
    subtitle: "What makes these films special to you? ✨",
    type: 'text',
    maxLength: 300,
    placeholder: 'The storytelling, characters, emotions, visuals, themes...',
    hint: "Be specific - this is where the AI learns your taste!"
  },
  {
    id: 3,
    question: "Pick 3 movie characters you connect with most",
    subtitle: "Characters that feel real or relatable to you 🎭",
    type: 'multiple-text',
    maxAnswers: 3,
    placeholder: 'Character name and movie...',
    examples: ['Tony Stark (Iron Man)', 'Hermione Granger (Harry Potter)', 'Rey (Star Wars)']
  },
  {
    id: 4,
    question: "What draws you to these characters?",
    subtitle: "Their personality, struggles, growth, or relatability 💭",
    type: 'text',
    maxLength: 250,
    placeholder: 'Their determination, flaws, humor, complexity, journey...',
    hint: "This helps us understand what character types you love!"
  },
  {
    id: 5,
    question: "Your top 3 favorite directors or creators?",
    subtitle: "Filmmakers whose style you absolutely love 🎥",
    type: 'multiple-director-search',
    maxAnswers: 3,
    placeholder: 'Director name...',
    examples: ['Christopher Nolan', 'Greta Gerwig', 'Jordan Peele', 'Denis Villeneuve']
  },
  {
    id: 6,
    question: "What mood are you usually in when watching movies?",
    subtitle: "You can select multiple moods 🌟",
    type: 'multi-select',
    maxAnswers: 3,
    options: [
      '😌 Relaxed and want comfort',
      '⚡ Energetic and want excitement', 
      '🤔 Thoughtful and want depth',
      '🚀 Adventurous and want thrills',
      '💕 Romantic and want feels',
      '😂 Playful and want laughs',
      '🌙 Late night atmospheric vibes',
      '🏠 Cozy weekend binges'
    ]
  },
  {
    id: 7,
    question: "What movie experiences do you enjoy most?",
    subtitle: "Select up to 3 scenarios that appeal to you 🍿",
    type: 'multi-select',
    maxAnswers: 3,
    options: [
      '🍿 Epic blockbusters with friends',
      '🏠 Solo comfort movies in pajamas',
      '💑 Date night romantic films',
      '👨‍👩‍👧‍👦 Family movie nights',
      '🧠 Mind-bending films that challenge me',
      '😱 Horror marathons for adrenaline',
      '🎭 Art house films for deep thoughts',
      '📱 Quick entertainment during breaks'
    ]
  },
  {
    id: 8,
    question: "When do you typically watch movies?",
    subtitle: "Help us time our recommendations perfectly! ⏰",
    type: 'multi-select',
    maxAnswers: 3,
    options: [
      '🌅 Early morning motivation (6-10 AM)',
      '☀️ Late morning relaxation (10 AM-12 PM)',
      '🌤️ Afternoon breaks (12-5 PM)',
      '🌆 Early evening unwind (5-8 PM)',
      '🌙 Prime time viewing (8-11 PM)',
      '🌃 Late night sessions (11 PM-2 AM)',
      '🦉 Very late night (2-6 AM)',
      '📅 Weekend binges only'
    ]
  },
  {
    id: 9,
    question: "What themes or topics fascinate you in movies?",
    subtitle: "Select themes that draw you in 🌟",
    type: 'multi-select',
    maxAnswers: 4,
    options: [
      '🧠 Psychological complexity',
      '💪 Overcoming challenges',
      '❤️ Love and relationships',
      '🌍 Social issues and justice',
      '🚀 Technology and future',
      '🏰 History and period pieces',
      '🎭 Identity and self-discovery',
      '👨‍👩‍👧‍👦 Family dynamics',
      '🌟 Coming-of-age stories',
      '🔮 Supernatural and mystical',
      '🎨 Art and creativity',
      '⚔️ Good vs evil conflicts'
    ]
  },
  {
    id: 10,
    question: "How do you like your movies to make you feel?",
    subtitle: "The emotional journey you prefer 🎭",
    type: 'multi-select',
    maxAnswers: 3,
    options: [
      '😊 Happy and uplifted',
      '😭 Moved to tears (good tears)',
      '🤯 Mind-blown and amazed',
      '😱 On the edge of my seat',
      '🤔 Thoughtful and contemplative',
      '😂 Laughing out loud',
      '🥰 Warm and fuzzy inside',
      '💪 Inspired and motivated',
      '🔥 Pumped up and energized',
      '😌 Calm and peaceful'
    ]
  }
]

// Enhanced AI Analysis for Multiple Answers
export class EnhancedAIAnalyzer {
  
  analyzeEnhancedResponses(responses: Record<number, any>) {
    const analysis = {
      favoriteMovies: responses[1] || [],
      movieReasons: responses[2] || '',
      relatedCharacters: responses[3] || [],
      characterReasons: responses[4] || '',
      favoriteDirectors: responses[5] || [],
      moods: responses[6] || [],
      scenarios: responses[7] || [],
      timings: responses[8] || [],
      themes: responses[9] || [],
      emotions: responses[10] || []
    }

    return {
      personalityProfile: this.buildPersonalityProfile(analysis),
      preferredGenres: this.extractGenrePreferences(analysis),
      viewingPatterns: this.analyzeViewingPatterns(analysis),
      emotionalProfile: this.buildEmotionalProfile(analysis),
      recommendationStrategy: this.buildRecommendationStrategy(analysis)
    }
  }

  private buildPersonalityProfile(analysis: any) {
    const traits = {
      openness: 0.5,
      extraversion: 0.5,
      complexity: 0.5,
      adventurousness: 0.5
    }

    // Analyze based on multiple data points
    const allText = `${analysis.movieReasons} ${analysis.characterReasons}`.toLowerCase()
    
    // Openness to experience
    if (allText.includes('different') || allText.includes('unique') || allText.includes('creative')) {
      traits.openness += 0.3
    }
    if (analysis.themes.some((t: string) => t.includes('Psychological') || t.includes('Art'))) {
      traits.openness += 0.2
    }

    // Extraversion
    if (analysis.scenarios.some((s: string) => s.includes('friends') || s.includes('family'))) {
      traits.extraversion += 0.3
    }
    if (analysis.emotions.some((e: string) => e.includes('energized') || e.includes('laughing'))) {
      traits.extraversion += 0.2
    }

    // Complexity preference
    if (allText.includes('complex') || allText.includes('layered') || allText.includes('deep')) {
      traits.complexity += 0.4
    }
    if (analysis.emotions.some((e: string) => e.includes('contemplative') || e.includes('mind-blown'))) {
      traits.complexity += 0.2
    }

    return {
      type: this.determinePersonalityType(traits),
      traits,
      description: this.generatePersonalityDescription(traits, analysis)
    }
  }

  private extractGenrePreferences(analysis: any) {
    const genreWeights: Record<string, number> = {}
    
    // Analyze favorite movies (if we had movie data)
    // For now, analyze text responses
    const allText = `${analysis.movieReasons} ${analysis.characterReasons}`.toLowerCase()
    
    // Genre detection from themes and moods
    if (analysis.themes.some((t: string) => t.includes('Love and relationships'))) {
      genreWeights['Romance'] = 0.8
    }
    if (analysis.themes.some((t: string) => t.includes('Technology'))) {
      genreWeights['Science Fiction'] = 0.8
    }
    if (analysis.themes.some((t: string) => t.includes('History'))) {
      genreWeights['History'] = 0.7
    }
    if (analysis.moods.some((m: string) => m.includes('laughs'))) {
      genreWeights['Comedy'] = 0.9
    }
    if (analysis.moods.some((m: string) => m.includes('thrills'))) {
      genreWeights['Action'] = 0.8
    }
    if (analysis.emotions.some((e: string) => e.includes('edge of my seat'))) {
      genreWeights['Thriller'] = 0.9
    }

    // Text analysis for genres
    if (allText.includes('action') || allText.includes('fight')) {
      genreWeights['Action'] = (genreWeights['Action'] || 0) + 0.7
    }
    if (allText.includes('funny') || allText.includes('comedy')) {
      genreWeights['Comedy'] = (genreWeights['Comedy'] || 0) + 0.8
    }
    if (allText.includes('emotional') || allText.includes('drama')) {
      genreWeights['Drama'] = (genreWeights['Drama'] || 0) + 0.8
    }

    return genreWeights
  }

  private analyzeViewingPatterns(analysis: any) {
    return {
      preferredTimes: analysis.timings,
      socialPreference: this.determineSocialPreference(analysis.scenarios),
      sessionLength: this.determineSessionLength(analysis.scenarios),
      moodAlignment: this.analyzeMoodAlignment(analysis.moods, analysis.emotions)
    }
  }

  private buildEmotionalProfile(analysis: any) {
    return {
      primaryEmotions: analysis.emotions.slice(0, 3),
      emotionalRange: analysis.emotions.length,
      intensityPreference: this.determineIntensityPreference(analysis.emotions),
      catharticNeeds: this.analyzeCatharticNeeds(analysis.emotions)
    }
  }

  private buildRecommendationStrategy(analysis: any) {
    const strategy = {
      diversityLevel: 'medium',
      riskTolerance: 'medium',
      noveltyPreference: 'medium',
      moodMatching: true
    }

    // Determine diversity preference
    if (analysis.themes.length > 6) {
      strategy.diversityLevel = 'high'
    } else if (analysis.themes.length < 3) {
      strategy.diversityLevel = 'low'
    }

    // Risk tolerance based on movie choices and themes
    if (analysis.themes.some((t: string) => t.includes('Art') || t.includes('Psychological'))) {
      strategy.riskTolerance = 'high'
    }

    return strategy
  }

  private determinePersonalityType(traits: any): string {
    if (traits.complexity > 0.7 && traits.openness > 0.7) {
      return 'Intellectual Explorer'
    } else if (traits.extraversion > 0.7) {
      return 'Social Connector'
    } else if (traits.adventurousness > 0.7) {
      return 'Thrill Seeker'
    } else if (traits.complexity > 0.6) {
      return 'Thoughtful Observer'
    } else {
      return 'Balanced Viewer'
    }
  }

  private generatePersonalityDescription(traits: any, analysis: any): string {
    const descriptors = []
    
    if (traits.openness > 0.6) descriptors.push('curious and open-minded')
    if (traits.extraversion > 0.6) descriptors.push('socially engaged')
    if (traits.complexity > 0.6) descriptors.push('intellectually driven')
    if (traits.adventurousness > 0.6) descriptors.push('adventurous spirit')
    
    const themeCount = analysis.themes.length
    if (themeCount > 6) descriptors.push('diverse interests')
    
    return `You're a ${descriptors.join(', ')} movie lover who appreciates ${analysis.themes.slice(0, 2).join(' and ').toLowerCase()}.`
  }

  private determineSocialPreference(scenarios: string[]): string {
    const socialCount = scenarios.filter(s => 
      s.includes('friends') || s.includes('family') || s.includes('date')
    ).length
    
    const soloCount = scenarios.filter(s => 
      s.includes('solo') || s.includes('pajamas')
    ).length

    if (socialCount > soloCount) return 'social'
    if (soloCount > socialCount) return 'solo'
    return 'flexible'
  }

  private determineSessionLength(scenarios: string[]): string {
    if (scenarios.some(s => s.includes('breaks'))) return 'short'
    if (scenarios.some(s => s.includes('binges'))) return 'long'
    return 'medium'
  }

  private analyzeMoodAlignment(moods: string[], emotions: string[]) {
    return {
      energyLevel: this.calculateEnergyLevel(moods, emotions),
      emotionalIntensity: this.calculateEmotionalIntensity(emotions),
      contemplationNeed: this.calculateContemplationNeed(moods, emotions)
    }
  }

  private calculateEnergyLevel(moods: string[], emotions: string[]): number {
    const highEnergyIndicators = [
      'energetic', 'excitement', 'thrills', 'pumped', 'energized'
    ]
    const allItems = [...moods, ...emotions].join(' ').toLowerCase()
    
    let score = 0.5
    highEnergyIndicators.forEach(indicator => {
      if (allItems.includes(indicator)) score += 0.15
    })
    
    return Math.min(1, score)
  }

  private calculateEmotionalIntensity(emotions: string[]): number {
    const intensityWords = ['tears', 'mind-blown', 'edge of my seat', 'pumped']
    const matches = emotions.filter(e => 
      intensityWords.some(word => e.toLowerCase().includes(word))
    ).length
    
    return Math.min(1, 0.3 + (matches * 0.2))
  }

  private calculateContemplationNeed(moods: string[], emotions: string[]): number {
    const contemplativeWords = ['thoughtful', 'depth', 'contemplative', 'mind-blown']
    const allItems = [...moods, ...emotions].join(' ').toLowerCase()
    
    let score = 0.3
    contemplativeWords.forEach(word => {
      if (allItems.includes(word)) score += 0.2
    })
    
    return Math.min(1, score)
  }

  private determineIntensityPreference(emotions: string[]): string {
    const highIntensity = emotions.filter(e => 
      e.includes('tears') || e.includes('edge') || e.includes('mind-blown')
    ).length
    
    if (highIntensity >= 2) return 'high'
    if (emotions.some(e => e.includes('calm') || e.includes('peaceful'))) return 'low'
    return 'medium'
  }

  private analyzeCatharticNeeds(emotions: string[]) {
    return {
      needsEmotionalRelease: emotions.some(e => e.includes('tears')),
      needsExcitement: emotions.some(e => e.includes('pumped') || e.includes('energized')),
      needsComfort: emotions.some(e => e.includes('warm') || e.includes('peaceful')),
      needsChallenge: emotions.some(e => e.includes('mind-blown') || e.includes('contemplative'))
    }
  }
}

export const enhancedAIAnalyzer = new EnhancedAIAnalyzer()

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

// REPLACE IT WITH THIS:

const handleComplete = async () => {
  setIsLoading(true)
  
  try {
    // Save to localStorage 
    localStorage.setItem('onboardingAnswers', JSON.stringify(answers))
    localStorage.setItem('onboardingCompleted', 'true')
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Redirect to dashboard
    router.push('/dashboard')
    
  } catch (error) {
    console.error('Error completing onboarding:', error)
    router.push('/dashboard')
  } finally {
    setIsLoading(false)
  }
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