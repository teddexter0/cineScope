// lib/smart-ai-recommendation-engine.ts - COMPLETE REPLACEMENT FILE WITH HUGGING FACE

/**
 * CineScope Hybrid AI System
 * 
 * PRIMARY: Custom Rule-Based AI Engine (FAST, RELIABLE)
 * SECONDARY: External AI APIs (ENHANCED FEATURES) 
 * - OpenAI: Advanced personality analysis
 * - Google Gemini: Content moderation & safety
 * - Hugging Face: Sentiment analysis & emotion detection
 * FALLBACK: TMDB Data Only
 */

// Optional external AI imports (only if API keys available)
let OpenAI: any, GoogleGenerativeAI: any, HfInference: any
try {
  if (process.env.OPENAI_API_KEY) {
    OpenAI = require('openai').default
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI
  }
  if (process.env.HUGGINGFACE_API_KEY) {
    HfInference = require('@huggingface/inference').HfInference
  }
} catch (error) {
  console.log('📦 External AI packages optional')
}

export class SmartAIRecommendationEngine {
  private tmdbApiKey = process.env.TMDB_API_KEY
  private openai?: any
  private gemini?: any
  private huggingface?: any
  
  constructor() {
    // Initialize external AIs ONLY if API keys are available
    try {
      if (process.env.OPENAI_API_KEY && OpenAI) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        console.log('🤖 OpenAI initialized for enhanced analysis')
      }
      
      if (process.env.GOOGLE_AI_API_KEY && GoogleGenerativeAI) {
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
        console.log('🧠 Google Gemini initialized for content moderation')
      }

      if (process.env.HUGGINGFACE_API_KEY && HfInference) {
        this.huggingface = new HfInference(process.env.HUGGINGFACE_API_KEY)
        console.log('🤗 Hugging Face initialized for sentiment analysis')
      }
    } catch (error) {
      console.log('⚠️ External AI initialization skipped')
    }
    
    console.log('🎯 Hybrid AI Engine initialized')
  }

  // PRIMARY AI: Custom Personality Analysis with Hugging Face Enhancement
  async analyzePersonality(responses: Record<number, string>) {
    const analysis = {
      favoriteMovie: responses[1] || '',
      relatedCharacter: responses[2] || '',
      mood: responses[3] || '',
      preference: responses[4] || '',
      importance: responses[5] || '',
      genre: responses[6] || '',
      favoriteActors: responses[7] || '',
      dealbreakers: responses[8] || ''
    }

    console.log('🧠 Custom AI Analyzing user responses:', analysis)

    // STEP 1: Custom semantic analysis
    let personalityProfile = {
      preferredGenres: this.extractGenresWithCustomAI(analysis),
      personalityType: this.determinePersonalityTypeCustom(analysis),
      moodPreferences: this.analyzeMoodPreferencesCustom(analysis),
      complexityLevel: this.determineComplexityCustom(analysis),
      aiInsight: this.generateCustomInsight(analysis),
      viewingPatterns: this.analyzeViewingPatterns(analysis),
      emotionalProfile: this.buildEmotionalProfile(analysis)
    }

    // STEP 2: Enhance with Hugging Face sentiment analysis (if available)
    try {
      if (this.huggingface) {
        personalityProfile = await this.enhanceWithHuggingFace(analysis, personalityProfile)
      }
    } catch (error) {
      console.log('⚠️ Hugging Face enhancement skipped')
    }

    console.log('🎯 Enhanced AI Personality Profile:', personalityProfile)
    return personalityProfile
  }

  // ADVANCED GENRE EXTRACTION WITH SEMANTIC ANALYSIS
  private extractGenresWithCustomAI(analysis: any): Record<string, number> {
    const genreWeights: Record<string, number> = {}
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    // Advanced semantic genre mapping
    const genreKeywords = {
      '18': ['drama', 'emotional', 'deep', 'touching', 'meaningful', 'character', 'relationship', 'life', 'real'],
      '35': ['comedy', 'funny', 'laugh', 'humor', 'light', 'entertaining', 'fun', 'jokes', 'witty'],
      '28': ['action', 'fight', 'adventure', 'exciting', 'thrilling', 'fast', 'adrenaline', 'intense'],
      '53': ['thriller', 'suspense', 'tension', 'mystery', 'edge', 'gripping', 'psychological'],
      '27': ['horror', 'scary', 'fear', 'dark', 'creepy', 'terrifying', 'supernatural'],
      '10749': ['romance', 'love', 'romantic', 'relationship', 'heart', 'passion', 'couple'],
      '878': ['sci-fi', 'science', 'future', 'space', 'technology', 'alien', 'futuristic'],
      '14': ['fantasy', 'magic', 'magical', 'mythical', 'supernatural', 'wizard', 'enchanting'],
      '80': ['crime', 'detective', 'investigation', 'police', 'criminal', 'law'],
      '12': ['adventure', 'journey', 'exploration', 'quest', 'travel', 'discovery']
    }

    // Direct genre selection from user's choice
    const selectedGenre = analysis.genre.toLowerCase()
    Object.entries(genreKeywords).forEach(([genreId, keywords]) => {
      if (keywords.some(keyword => selectedGenre.includes(keyword))) {
        genreWeights[genreId] = 0.9
      }
    })

    // Semantic analysis of all responses
    Object.entries(genreKeywords).forEach(([genreId, keywords]) => {
      const matches = keywords.filter(keyword => allText.includes(keyword)).length
      if (matches > 0) {
        const confidence = Math.min(0.8, matches * 0.15)
        genreWeights[genreId] = (genreWeights[genreId] || 0) + confidence
      }
    })

    // Mood-based genre inference
    const moodText = analysis.mood.toLowerCase()
    if (moodText.includes('excitement') || moodText.includes('energy')) {
      genreWeights['28'] = (genreWeights['28'] || 0) + 0.7
      genreWeights['12'] = (genreWeights['12'] || 0) + 0.6
    }
    if (moodText.includes('comfort') || moodText.includes('relaxed')) {
      genreWeights['35'] = (genreWeights['35'] || 0) + 0.6
      genreWeights['10749'] = (genreWeights['10749'] || 0) + 0.5
    }
    if (moodText.includes('thoughtful') || moodText.includes('depth')) {
      genreWeights['18'] = (genreWeights['18'] || 0) + 0.8
      genreWeights['53'] = (genreWeights['53'] || 0) + 0.6
    }

    return genreWeights
  }

  // ADVANCED PERSONALITY TYPE DETERMINATION
  private determinePersonalityTypeCustom(analysis: any): string {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    const scores = {
      'Intellectual Explorer': 0,
      'Emotional Connector': 0,
      'Entertainment Seeker': 0,
      'Escapist Explorer': 0,
      'Critical Analyst': 0,
      'Nostalgic Dreamer': 0
    }

    // Analyze language patterns and preferences
    const intellectualTerms = ['complex', 'challenge', 'think', 'analyze', 'understand', 'meaning', 'philosophy']
    const emotionalTerms = ['feel', 'emotional', 'heart', 'touching', 'connect', 'relate', 'empathy']
    const entertainmentTerms = ['fun', 'entertainment', 'enjoy', 'excitement', 'thrill', 'popular']
    const escapistTerms = ['escape', 'different', 'adventure', 'fantasy', 'world', 'imagination']
    const criticalTerms = ['quality', 'cinematography', 'directing', 'acting', 'script', 'artistic']
    const nostalgicTerms = ['classic', 'old', 'vintage', 'reminds', 'childhood', 'nostalgia']

    scores['Intellectual Explorer'] = this.countTermMatches(allText, intellectualTerms)
    scores['Emotional Connector'] = this.countTermMatches(allText, emotionalTerms)
    scores['Entertainment Seeker'] = this.countTermMatches(allText, entertainmentTerms)
    scores['Escapist Explorer'] = this.countTermMatches(allText, escapistTerms)
    scores['Critical Analyst'] = this.countTermMatches(allText, criticalTerms)
    scores['Nostalgic Dreamer'] = this.countTermMatches(allText, nostalgicTerms)

    // Find the highest scoring personality type
    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0]
  }

  private countTermMatches(text: string, terms: string[]): number {
    return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0)
  }

  // ADVANCED MOOD PREFERENCE ANALYSIS
  private analyzeMoodPreferencesCustom(analysis: any): string[] {
    const preferences = []
    const moodText = analysis.mood.toLowerCase()
    const allText = Object.values(analysis).join(' ').toLowerCase()

    const moodMappings = {
      'comforting': ['comfort', 'relaxed', 'cozy', 'warm', 'peaceful'],
      'thrilling': ['excitement', 'thrill', 'adrenaline', 'intense', 'edge'],
      'thought-provoking': ['thoughtful', 'deep', 'meaningful', 'philosophical'],
      'adventurous': ['adventure', 'journey', 'exploration', 'discovery'],
      'romantic': ['romantic', 'love', 'heart', 'passion', 'relationship'],
      'humorous': ['laugh', 'funny', 'comedy', 'humor', 'witty'],
      'inspiring': ['inspire', 'motivate', 'uplifting', 'hope', 'triumph'],
      'nostalgic': ['nostalgia', 'childhood', 'memories', 'past', 'classic']
    }

    Object.entries(moodMappings).forEach(([mood, keywords]) => {
      if (keywords.some(keyword => moodText.includes(keyword) || allText.includes(keyword))) {
        preferences.push(mood)
      }
    })

    return preferences.length > 0 ? preferences : ['entertaining']
  }

  // COMPLEXITY ANALYSIS WITH NUANCED SCORING
  private determineComplexityCustom(analysis: any): number {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    let complexity = 0.5

    const complexityIndicators = {
      high: ['complex', 'intricate', 'layered', 'sophisticated', 'nuanced', 'challenging'],
      medium: ['interesting', 'engaging', 'thoughtful', 'well-made'],
      low: ['simple', 'straightforward', 'easy', 'light', 'casual', 'basic']
    }

    const highMatches = this.countTermMatches(allText, complexityIndicators.high)
    const lowMatches = this.countTermMatches(allText, complexityIndicators.low)
    const mediumMatches = this.countTermMatches(allText, complexityIndicators.medium)

    complexity += (highMatches * 0.15) - (lowMatches * 0.1) + (mediumMatches * 0.05)

    // Adjust based on preferred content type
    if (analysis.preference.includes('challenge')) complexity += 0.2
    if (analysis.preference.includes('comfort')) complexity -= 0.1
    if (analysis.importance.includes('plot')) complexity += 0.1
    if (analysis.importance.includes('entertainment')) complexity -= 0.05

    return Math.max(0.1, Math.min(1.0, complexity))
  }

  // CUSTOM AI INSIGHT GENERATION
  private generateCustomInsight(analysis: any): string {
    const personalityType = this.determinePersonalityTypeCustom(analysis)
    const topMood = this.analyzeMoodPreferencesCustom(analysis)[0] || 'entertaining'
    const complexity = this.determineComplexityCustom(analysis)
    
    let insight = `Based on your unique response patterns, you're a ${personalityType} who gravitates toward ${topMood} content. `
    
    if (complexity > 0.7) {
      insight += "Your taste suggests you appreciate sophisticated narratives with multiple layers, complex character development, and films that challenge conventional storytelling. "
    } else if (complexity < 0.4) {
      insight += "You prefer well-crafted, accessible stories that deliver clear entertainment value without overwhelming complexity. "
    } else {
      insight += "You enjoy the perfect balance of engaging storytelling with just enough depth to keep you invested. "
    }
    
    // Add personalized elements
    const favoriteMovie = analysis.favoriteMovie
    if (favoriteMovie && favoriteMovie.length > 10) {
      insight += `Your appreciation for films like "${favoriteMovie}" reveals your taste for quality cinema that resonates on both emotional and intellectual levels.`
    }

    return insight
  }

  // VIEWING PATTERN ANALYSIS
  private analyzeViewingPatterns(analysis: any): any {
    const patterns = {
      preferredLength: 'feature', // feature, short, series
      socialViewing: 'mixed', // solo, social, mixed
      timePreference: 'evening', // morning, afternoon, evening, late-night
      rewatchability: 'medium' // low, medium, high
    }

    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    if (allText.includes('friends') || allText.includes('family') || allText.includes('together')) {
      patterns.socialViewing = 'social'
    } else if (allText.includes('alone') || allText.includes('myself')) {
      patterns.socialViewing = 'solo'
    }

    if (allText.includes('rewatch') || allText.includes('again') || allText.includes('multiple')) {
      patterns.rewatchability = 'high'
    }

    return patterns
  }

  // EMOTIONAL PROFILE BUILDING
  private buildEmotionalProfile(analysis: any): any {
    const profile = {
      emotionalRange: 'wide', // narrow, medium, wide
      catharticNeed: 'medium', // low, medium, high
      optimismLevel: 'balanced', // pessimistic, balanced, optimistic
      intensityTolerance: 'medium' // low, medium, high
    }

    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    if (allText.includes('cry') || allText.includes('emotional') || allText.includes('feel')) {
      profile.catharticNeed = 'high'
    }
    
    if (allText.includes('happy') || allText.includes('uplifting') || allText.includes('positive')) {
      profile.optimismLevel = 'optimistic'
    }
    
    if (allText.includes('intense') || allText.includes('extreme') || allText.includes('powerful')) {
      profile.intensityTolerance = 'high'
    }

    return profile
  }

  // MAIN RECOMMENDATION ENGINE - GENERATES FRESH, PERSONALIZED MOVIES
  async generateIntelligentRecommendations(userProfile: any): Promise<any[]> {
    try {
      console.log('🎬 Generating hybrid AI recommendations for profile:', userProfile.personalityType)
      
      const topGenres = Object.entries(userProfile.preferredGenres)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([genreId]) => genreId)

      console.log('🎯 Priority genres:', topGenres)

      const allMovies: any[] = []
      const currentTime = Date.now()
      const randomSeed = Math.floor(currentTime / (1000 * 60 * 10)) % 10 + 1

      // Fetch diverse content based on AI analysis
      for (let i = 0; i < topGenres.length; i++) {
        const genreId = topGenres[i]
        const page = (randomSeed + i) % 5 + 1
        const movies = await this.fetchIntelligentMoviesByGenre(genreId, page, userProfile)
        allMovies.push(...movies)
      }

      // Add variety based on personality type
      const personalityMovies = await this.fetchMoviesForPersonalityType(userProfile.personalityType, randomSeed)
      allMovies.push(...personalityMovies)
      
      // Add trending content filtered by user preferences
      const trendingMovies = await this.fetchFilteredTrendingMovies(userProfile, randomSeed)
      allMovies.push(...trendingMovies)
      
      // Add highly rated content matching complexity preference
      const qualityMovies = await this.fetchQualityMovies(userProfile.complexityLevel, randomSeed)
      allMovies.push(...qualityMovies)

      // Remove duplicates and apply AI scoring
      const uniqueMovies = this.removeDuplicates(allMovies)
      
      const aiScoredMovies = uniqueMovies.map(movie => ({
        ...movie,
        aiScore: this.calculateAdvancedAIScore(movie, userProfile)
      })).sort((a, b) => b.aiScore - a.aiScore)

      console.log('🏆 AI recommendations generated:', aiScoredMovies.slice(0, 12))
      return aiScoredMovies.slice(0, 12)
      
    } catch (error) {
      console.error('❌ Error in AI recommendation engine:', error)
      return await this.getFallbackRecommendations()
    }
  }

  // INTELLIGENT GENRE-BASED FETCHING
  private async fetchIntelligentMoviesByGenre(genreId: string, page: number, userProfile: any): Promise<any[]> {
    try {
      const sortOptions = userProfile.complexityLevel > 0.6 
        ? ['vote_average.desc', 'vote_count.desc'] 
        : ['popularity.desc', 'release_date.desc']
      
      const randomSort = sortOptions[page % sortOptions.length]
      const minVotes = userProfile.complexityLevel > 0.7 ? 100 : 50
      
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&with_genres=${genreId}&sort_by=${randomSort}&vote_count.gte=${minVotes}&page=${page}&vote_average.gte=6.0`
      )
      const data = await response.json()
      return data.results?.slice(0, 4) || []
    } catch (error) {
      console.error(`Error fetching intelligent genre ${genreId}:`, error)
      return []
    }
  }

  // PERSONALITY-SPECIFIC MOVIE FETCHING
  private async fetchMoviesForPersonalityType(personalityType: string, seed: number): Promise<any[]> {
    try {
      let query = ''
      
      switch (personalityType) {
        case 'Intellectual Explorer':
          query = 'psychological OR philosophical OR complex'
          break
        case 'Emotional Connector':
          query = 'drama OR emotional OR heartwarming'
          break
        case 'Entertainment Seeker':
          query = 'blockbuster OR popular OR entertaining'
          break
        case 'Escapist Explorer':
          query = 'fantasy OR adventure OR magical'
          break
        case 'Critical Analyst':
          query = 'critically acclaimed OR award winning'
          break
        case 'Nostalgic Dreamer':
          query = 'classic OR vintage OR timeless'
          break
        default:
          query = 'highly rated'
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(query)}&page=${seed % 3 + 1}`
      )
      const data = await response.json()
      return data.results?.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching personality movies:', error)
      return []
    }
  }

  // ADVANCED AI SCORING ALGORITHM
  private calculateAdvancedAIScore(movie: any, userProfile: any): number {
    let score = movie.vote_average * 10 // Base quality score

    // Genre preference matching (weighted heavily)
    if (movie.genre_ids) {
      movie.genre_ids.forEach((genreId: number) => {
        const weight = userProfile.preferredGenres[genreId.toString()]
        if (weight) {
          score += weight * 60 // Increased weight for genre matching
        }
      })
    }

    // Personality type bonuses
    const personalityBonuses = {
      'Intellectual Explorer': movie.vote_average > 7.5 ? 35 : 0,
      'Entertainment Seeker': movie.popularity > 100 ? 30 : 0,
      'Emotional Connector': movie.genre_ids?.includes(18) ? 40 : 0,
      'Escapist Explorer': movie.genre_ids?.includes(14) || movie.genre_ids?.includes(878) ? 35 : 0,
      'Critical Analyst': movie.vote_count > 1000 && movie.vote_average > 7.0 ? 30 : 0,
      'Nostalgic Dreamer': new Date(movie.release_date).getFullYear() < 2010 ? 25 : 0
    }

    score += personalityBonuses[userProfile.personalityType] || 0

    // Complexity preference alignment
    const releaseYear = new Date(movie.release_date).getFullYear()
    const isRecent = releaseYear > 2015
    const isClassic = releaseYear < 2000
    
    if (userProfile.complexityLevel > 0.7) {
      if (movie.vote_average > 7.5 && movie.vote_count > 500) score += 25
      if (isClassic) score += 15
    } else if (userProfile.complexityLevel < 0.4) {
      if (movie.popularity > 50) score += 20
      if (isRecent) score += 10
    }

    // Mood preference bonuses
    userProfile.moodPreferences?.forEach((mood: string) => {
      const moodGenreMap = {
        'thrilling': [28, 53], // Action, Thriller
        'comforting': [35, 10751], // Comedy, Family
        'romantic': [10749], // Romance
        'adventurous': [12, 14], // Adventure, Fantasy
        'thought-provoking': [18, 53] // Drama, Mystery
      }
      
      const genresForMood = moodGenreMap[mood as keyof typeof moodGenreMap] || []
      if (movie.genre_ids?.some((id: number) => genresForMood.includes(id))) {
        score += 20
      }
    })

    // Recency bias for variety
    const yearDiff = new Date().getFullYear() - releaseYear
    if (yearDiff >= 2 && yearDiff <= 15) {
      score += 15 // Sweet spot for established but not too old movies
    }

    return Math.round(score)
  }

  // FILTERED TRENDING MOVIES
  private async fetchFilteredTrendingMovies(userProfile: any, seed: number): Promise<any[]> {
    try {
      const timeWindow = seed % 2 === 0 ? 'day' : 'week'
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${this.tmdbApiKey}&page=${seed % 3 + 1}`
      )
      const data = await response.json()
      
      // Filter by user's complexity preference
      const filtered = data.results?.filter((movie: any) => {
        if (userProfile.complexityLevel > 0.7) {
          return movie.vote_average > 7.0 // High-quality trending
        } else if (userProfile.complexityLevel < 0.4) {
          return movie.popularity > 100 // Popular trending
        }
        return movie.vote_average > 6.5 // Balanced trending
      }) || []
      
      return filtered.slice(0, 3)
    } catch (error) {
      console.error('Error fetching filtered trending movies:', error)
      return []
    }
  }

  // QUALITY MOVIES BY COMPLEXITY
  private async fetchQualityMovies(complexityLevel: number, seed: number): Promise<any[]> {
    try {
      const minRating = complexityLevel > 0.7 ? 8.0 : complexityLevel > 0.4 ? 7.0 : 6.5
      const minVotes = complexityLevel > 0.7 ? 1000 : 500
      
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&sort_by=vote_average.desc&vote_average.gte=${minRating}&vote_count.gte=${minVotes}&page=${seed % 3 + 1}`
      )
      const data = await response.json()
      return data.results?.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching quality movies:', error)
      return []
    }
  }

  // INTELLIGENT KEYWORD SEARCH (PUBLIC METHOD)
  async generateIntelligentKeywordSearch(userProfile: any): Promise<any[]> {
    try {
      const keywords = this.generateSmartKeywords(userProfile)
      console.log('🔍 Custom AI generated keywords:', keywords)
      
      const allResults: any[] = []
      
      for (const keyword of keywords) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(keyword)}&page=1`
          )
          const data = await response.json()
          if (data.results) {
            allResults.push(...data.results.slice(0, 4))
          }
        } catch (error) {
          console.error(`Error searching keyword ${keyword}:`, error)
        }
      }
      
      return this.removeDuplicates(allResults)
    } catch (error) {
      console.error('Keyword search error:', error)
      return []
    }
  }

  private generateSmartKeywords(userProfile: any): string[] {
    const keywords: string[] = []
    
    // Personality-based keywords
    const personalityKeywords = {
      'Intellectual Explorer': ['psychological thriller', 'mind bending', 'philosophical'],
      'Emotional Connector': ['emotional drama', 'heartwarming', 'character study'],
      'Entertainment Seeker': ['blockbuster', 'crowd pleaser', 'entertaining'],
      'Escapist Explorer': ['epic adventure', 'magical world', 'fantastic journey'],
      'Critical Analyst': ['critically acclaimed', 'award winning', 'masterpiece'],
      'Nostalgic Dreamer': ['classic cinema', 'timeless story', 'vintage charm']
    }
    
    keywords.push(...(personalityKeywords[userProfile.personalityType as keyof typeof personalityKeywords] || []))
    
    // Mood-based keywords
    userProfile.moodPreferences?.forEach((mood: string) => {
      const moodKeywords = {
        'thrilling': ['edge of seat', 'suspenseful'],
        'comforting': ['feel good', 'uplifting'],
        'thought-provoking': ['deep meaning', 'philosophical'],
        'adventurous': ['epic journey', 'exploration'],
        'romantic': ['love story', 'romantic drama'],
        'humorous': ['witty comedy', 'laugh out loud']
      }
      
      keywords.push(...(moodKeywords[mood as keyof typeof moodKeywords] || []))
    })
    
    return keywords.slice(0, 4) // Limit to top 4 keywords
  }

  // PUBLIC UTILITY METHODS (for dashboard use)
  removeDuplicates(movies: any[]): any[] {
    const seen = new Set()
    return movies.filter(movie => {
      if (!movie.id || seen.has(movie.id)) return false
      seen.add(movie.id)
      return movie.poster_path && movie.vote_average > 0 && movie.overview
    })
  }

  async getFallbackRecommendations(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}&page=1`
      )
      const data = await response.json()
      return (data.results || [])
        .filter((movie: any) => movie.vote_average > 7.0 && movie.poster_path)
        .slice(0, 12)
    } catch (error) {
      console.error('Fallback recommendations failed:', error)
      return []
    }
  }

  // OPTIONAL: Enhanced analysis with external AI (if available)
  async enhanceWithExternalAI(responses: Record<number, string>, baseAnalysis: any) {
    try {
      // Only enhance if external AI is available
      if (this.openai) {
        return await this.enhanceWithOpenAI(responses, baseAnalysis)
      } else if (this.gemini) {
        return await this.enhanceWithGemini(responses, baseAnalysis)
      }
    } catch (error) {
      console.log('⚠️ External AI enhancement failed, using custom analysis')
    }
    
    return baseAnalysis
  }

  private async enhanceWithOpenAI(responses: Record<number, string>, baseAnalysis: any) {
    try {
      console.log('🤖 Enhancing analysis with OpenAI...')
      
      const prompt = `Analyze this movie lover's personality based on their responses:

Favorite Movie: "${responses[1]}"
Character Connection: "${responses[2]}"
Viewing Mood: "${responses[3]}"
Content Preference: "${responses[4]}"
Important Elements: "${responses[5]}"
Preferred Genre: "${responses[6]}"
Favorite Actors: "${responses[7]}"
Dealbreakers: "${responses[8]}"

Current analysis suggests they are a "${baseAnalysis.personalityType}".

Provide enhanced insight (2-3 sentences) about their movie preferences and viewing psychology.`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (aiResponse) {
        return {
          ...baseAnalysis,
          aiInsight: aiResponse,
          analysisMethod: 'hybrid_openai_enhanced'
        }
      }
    } catch (error) {
      console.log('⚠️ OpenAI enhancement failed')
    }
    
    return baseAnalysis
  }

  private async enhanceWithGemini(responses: Record<number, string>, baseAnalysis: any) {
    try {
      console.log('🧠 Enhancing analysis with Gemini...')
      
      const model = this.gemini.getGenerativeModel({ model: "gemini-pro" })
      
      const prompt = `As a movie psychology expert, analyze this person's film personality:

Responses: ${JSON.stringify(responses)}
Base Analysis: ${baseAnalysis.personalityType}

Provide enhanced insights about their viewing psychology in 2-3 sentences.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      if (text) {
        return {
          ...baseAnalysis,
          aiInsight: text.substring(0, 500),
          analysisMethod: 'hybrid_gemini_enhanced'
        }
      }
    } catch (error) {
      console.log('⚠️ Gemini enhancement failed')
    }}
  // HUGGING FACE ENHANCEMENT: Sentiment & Emotion Analysis
  private async enhanceWithHuggingFace(analysis: any, baseProfile: any) {
    try {
      console.log('🤗 Enhancing analysis with Hugging Face sentiment analysis...')
      
      // Combine all user responses for sentiment analysis
      const allText = Object.values(analysis).join('. ')
      
      // Sentiment analysis
      const sentiment = await this.huggingface.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: allText
      })

      // Emotion detection
      const emotions = await this.huggingface.textClassification({
        model: 'j-hartmann/emotion-english-distilroberta-base',
        inputs: allText
      })

      // Extract insights from sentiment/emotion analysis
      const sentimentScore = sentiment[0]?.score || 0.5
      const topEmotion = emotions[0]?.label || 'neutral'
      const emotionScore = emotions[0]?.score || 0.5

      console.log('🤗 HF Analysis - Sentiment:', sentiment[0]?.label, 'Emotion:', topEmotion)

      // Enhance personality profile with HF insights
      const enhancedProfile = {
        ...baseProfile,
        sentimentProfile: {
          overallSentiment: sentiment[0]?.label || 'neutral',
          sentimentScore: sentimentScore,
          dominantEmotion: topEmotion,
          emotionConfidence: emotionScore,
          emotionalRange: this.calculateEmotionalRange(emotions)
        },
        // Adjust personality type based on sentiment
        personalityType: this.refinePersonalityWithSentiment(baseProfile.personalityType, sentiment[0]?.label, topEmotion),
        // Enhanced AI insight with emotional context
        aiInsight: this.generateEnhancedInsight(baseProfile, sentiment[0]?.label, topEmotion),
        analysisMethod: 'hybrid_huggingface_enhanced'
      }

      return enhancedProfile
    } catch (error) {
      console.log('⚠️ Hugging Face enhancement failed:', error)
      return baseProfile
    }
  }

  private calculateEmotionalRange(emotions: any[]): string {
    const emotionCount = emotions.filter(e => e.score > 0.1).length
    if (emotionCount >= 4) return 'wide'
    if (emotionCount >= 2) return 'moderate'
    return 'focused'
  }

  private refinePersonalityWithSentiment(baseType: string, sentiment: string, emotion: string): string {
    // Adjust personality type based on emotional analysis
    if (emotion === 'joy' && sentiment === 'POSITIVE') {
      if (baseType.includes('Explorer')) return baseType // Keep explorers happy
      return 'Entertainment Seeker' // Positive emotions lean toward entertainment
    }
    
    if (emotion === 'sadness' || sentiment === 'NEGATIVE') {
      return 'Emotional Connector' // Sad/negative emotions prefer deeper connections
    }
    
    if (emotion === 'anger' || emotion === 'fear') {
      return 'Intellectual Explorer' // Complex emotions prefer challenging content
    }

    return baseType // Keep original if no strong emotional indicators
  }

  private generateEnhancedInsight(baseProfile: any, sentiment: string, emotion: string): string {
    let insight = baseProfile.aiInsight
    
    // Add emotional context to insight
    if (sentiment === 'POSITIVE' && emotion === 'joy') {
      insight += ` Your positive emotional outlook suggests you'd particularly enjoy uplifting and feel-good content that reinforces optimism.`
    } else if (sentiment === 'NEGATIVE' || emotion === 'sadness') {
      insight += ` Your thoughtful responses indicate you appreciate films that explore deeper human emotions and provide cathartic experiences.`
    } else if (emotion === 'surprise' || emotion === 'fear') {
      insight += ` Your responses show an appreciation for unexpected narratives and content that challenges conventional storytelling.`
    }
    
    return insight
  }
}
export const smartAIEngine = new SmartAIRecommendationEngine()
export const hybridAIEngine = smartAIEngine // Alias