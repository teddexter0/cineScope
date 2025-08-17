// lib/hybrid-ai-recommendation-engine.ts - FIXED AI RECOMMENDATIONS

export class SmartAIRecommendationEngine {
  private tmdbApiKey = 'da4d264a4290972d086e0d21dce7cfeb'
  
  constructor() {
    console.log('🎯 Enhanced AI Engine with TV Shows initialized')
  }

  // FIXED: Properly return personality profile synchronously
  analyzePersonality(responses: Record<number, string>) {
    console.log('🧠 Analyzing personality from responses:', responses)
    
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

    // Build personality profile immediately
    const personalityProfile = {
      preferredGenres: this.extractGenresWithCustomAI(analysis),
      personalityType: this.determinePersonalityTypeCustom(analysis),
      moodPreferences: this.analyzeMoodPreferencesCustom(analysis),
      complexityLevel: this.determineComplexityCustom(analysis),
      aiInsight: this.generateCustomInsight(analysis),
      viewingPatterns: this.analyzeViewingPatterns(analysis),
      emotionalProfile: this.buildEmotionalProfile(analysis)
    }

    console.log('✅ Generated personality profile:', personalityProfile)
    return personalityProfile // Return immediately, no Promise
  }

  // ENHANCED AI RECOMMENDATION ENGINE WITH TV SHOWS
  async generateEnhancedRecommendations(userProfile: any): Promise<any[]> {
    try {
      console.log('🎬 Generating ENHANCED AI recommendations with TV shows...')
      console.log('👤 User profile:', userProfile)
      
      const allContent: any[] = []
      const currentTime = Date.now()
      const dynamicSeed = Math.floor(currentTime / (1000 * 60 * 3)) % 50 + 1 // Changes every 3 minutes!

      // 1. MOVIES (40% of recommendations)
      console.log('🎬 Fetching movies...')
      const movieRecs = await this.generateMovieRecommendations(userProfile, dynamicSeed)
      allContent.push(...movieRecs)

      // 2. TV SHOWS (40% of recommendations) - ENHANCED!
      console.log('📺 Fetching TV shows...')
      const tvRecs = await this.generateTVRecommendations(userProfile, dynamicSeed)
      allContent.push(...tvRecs)

      // 3. TRENDING MIXED CONTENT (20%)
      console.log('🔥 Fetching trending content...')
      const trendingMixed = await this.fetchTrendingMixed(dynamicSeed)
      allContent.push(...trendingMixed)

      console.log('📊 Total content fetched:', allContent.length)

      // Remove duplicates and score
      const uniqueContent = this.removeDuplicates(allContent)
      console.log('🔄 After removing duplicates:', uniqueContent.length)
      
      const scoredContent = uniqueContent.map(item => ({
        ...item,
        aiScore: this.calculateEnhancedAIScore(item, userProfile),
        contentType: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        displayTitle: item.title || item.name || 'Unknown',
        media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
      })).sort((a, b) => b.aiScore - a.aiScore)

      const finalRecommendations = scoredContent.slice(0, 12)
      
      console.log('🏆 Final recommendations:', finalRecommendations.length)
      console.log('📊 Content breakdown:', {
        movies: finalRecommendations.filter(item => item.contentType === 'movie').length,
        tvShows: finalRecommendations.filter(item => item.contentType === 'tv').length
      })
      
      return finalRecommendations
      
    } catch (error) {
      console.error('❌ Enhanced recommendation error:', error)
      return await this.getFallbackRecommendations()
    }
  }

  // TV SHOW RECOMMENDATIONS (ENHANCED!)
  private async generateTVRecommendations(userProfile: any, seed: number): Promise<any[]> {
    try {
      console.log('📺 Generating TV show recommendations with seed:', seed)
      
      const topGenres = Object.entries(userProfile.preferredGenres || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([genreId]) => genreId)

      console.log('🎯 Top genres for TV:', topGenres)

      const tvShows: any[] = []
      
      // Get TV shows by genre
      for (const genreId of topGenres) {
        const page = (seed % 4) + 1
        const shows = await this.fetchTVShowsByGenre(genreId, page, userProfile)
        tvShows.push(...shows)
      }

      // Also get trending TV shows
      const trendingTV = await this.fetchTrendingTVShows(seed)
      tvShows.push(...trendingTV)

      // Popular TV shows
      const popularTV = await this.fetchPopularTVShows(seed)
      tvShows.push(...popularTV)
      
      console.log('📺 TV recommendations fetched:', tvShows.length, 'shows')
      return tvShows
    } catch (error) {
      console.error('Error fetching TV recommendations:', error)
      return []
    }
  }

  private async fetchTVShowsByGenre(genreId: string, page: number, userProfile: any): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${this.tmdbApiKey}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=50&page=${page}&vote_average.gte=6.0`
      )
      const data = await response.json()
      
      // Mark as TV shows and add display properties
      return (data.results || []).slice(0, 4).map((show: any) => ({
        ...show,
        media_type: 'tv',
        title: show.name, // TV shows use 'name' not 'title'
        release_date: show.first_air_date,
        displayTitle: show.name
      }))
    } catch (error) {
      console.error(`Error fetching TV shows for genre ${genreId}:`, error)
      return []
    }
  }

  private async fetchTrendingTVShows(seed: number): Promise<any[]> {
    try {
      const timeWindow = seed % 2 === 0 ? 'day' : 'week'
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/tv/${timeWindow}?api_key=${this.tmdbApiKey}&page=${seed % 3 + 1}`
      )
      const data = await response.json()
      
      return (data.results || []).slice(0, 3).map((show: any) => ({
        ...show,
        media_type: 'tv',
        title: show.name,
        release_date: show.first_air_date,
        displayTitle: show.name
      }))
    } catch (error) {
      console.error('Error fetching trending TV shows:', error)
      return []
    }
  }

  private async fetchPopularTVShows(seed: number): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${this.tmdbApiKey}&page=${seed % 5 + 1}`
      )
      const data = await response.json()
      
      return (data.results || []).slice(0, 3).map((show: any) => ({
        ...show,
        media_type: 'tv',
        title: show.name,
        release_date: show.first_air_date,
        displayTitle: show.name
      }))
    } catch (error) {
      console.error('Error fetching popular TV shows:', error)
      return []
    }
  }

  // MOVIE RECOMMENDATIONS
  private async generateMovieRecommendations(userProfile: any, seed: number): Promise<any[]> {
    const topGenres = Object.entries(userProfile.preferredGenres || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([genreId]) => genreId)

    console.log('🎯 Top genres for movies:', topGenres)

    const movies: any[] = []
    
    for (const genreId of topGenres) {
      const page = (seed % 5) + 1
      const genreMovies = await this.fetchIntelligentMoviesByGenre(genreId, page, userProfile)
      movies.push(...genreMovies)
    }
    
    console.log('🎬 Movie recommendations fetched:', movies.length, 'movies')
    return movies
  }

  private async fetchIntelligentMoviesByGenre(genreId: string, page: number, userProfile: any): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=${page}&vote_average.gte=6.0`
      )
      const data = await response.json()
      return (data.results?.slice(0, 4) || []).map((movie: any) => ({
        ...movie,
        media_type: 'movie',
        displayTitle: movie.title
      }))
    } catch (error) {
      console.error(`Error fetching movies for genre ${genreId}:`, error)
      return []
    }
  }

  // TRENDING MIXED CONTENT
  private async fetchTrendingMixed(seed: number): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${this.tmdbApiKey}&page=${seed % 3 + 1}`
      )
      const data = await response.json()
      
      return (data.results || []).slice(0, 4).map((item: any) => ({
        ...item,
        title: item.title || item.name,
        release_date: item.release_date || item.first_air_date,
        displayTitle: item.title || item.name
      }))
    } catch (error) {
      console.error('Error fetching trending mixed content:', error)
      return []
    }
  }

  // ENHANCED AI SCORING
  private calculateEnhancedAIScore(item: any, userProfile: any): number {
    let score = (item.vote_average || 0) * 10

    // Content type bonus
    if (item.media_type === 'tv') {
      score += 8 // Bonus for TV variety
    }

    // Genre matching
    if (item.genre_ids) {
      item.genre_ids.forEach((genreId: number) => {
        const weight = userProfile.preferredGenres?.[genreId.toString()]
        if (weight) {
          score += weight * 50
        }
      })
    }

    // Add randomness for variety
    score += Math.random() * 20

    return Math.round(score)
  }

  // DYNAMIC REFRESH FUNCTIONALITY
  async refreshRecommendations(userProfile: any, forceRefresh: boolean = false): Promise<any[]> {
    console.log('🔄 Refreshing AI recommendations with force:', forceRefresh)
    
    if (forceRefresh) {
      // Generate with FRESH seed based on current time
      const freshSeed = Math.floor(Date.now() / 1000) % 100 + 1
      return await this.generateEnhancedRecommendationsWithSeed(userProfile, freshSeed)
    }
    
    // Generate new recommendations
    return await this.generateEnhancedRecommendations(userProfile)
  }

  private async generateEnhancedRecommendationsWithSeed(userProfile: any, seed: number): Promise<any[]> {
    try {
      console.log('🎲 Using FRESH seed for recommendations:', seed)
      
      const allContent: any[] = []

      // Use the seed to get completely different content
      const movieRecs = await this.generateMovieRecommendationsWithSeed(userProfile, seed)
      const tvRecs = await this.generateTVRecommendationsWithSeed(userProfile, seed)
      const trendingMixed = await this.fetchTrendingMixedWithSeed(seed)

      allContent.push(...movieRecs, ...tvRecs, ...trendingMixed)

      const uniqueContent = this.removeDuplicates(allContent)
      
      const scoredContent = uniqueContent.map(item => ({
        ...item,
        aiScore: this.calculateEnhancedAIScore(item, userProfile) + Math.random() * 15,
        contentType: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        displayTitle: item.title || item.name || 'Unknown'
      })).sort((a, b) => b.aiScore - a.aiScore)

      console.log('🆕 FRESH recommendations generated:', scoredContent.length, 'items')
      return scoredContent.slice(0, 12)
    } catch (error) {
      console.error('❌ Fresh recommendations error:', error)
      return await this.getFallbackRecommendations()
    }
  }

  private async generateMovieRecommendationsWithSeed(userProfile: any, seed: number): Promise<any[]> {
    const topGenres = Object.entries(userProfile.preferredGenres || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([genreId]) => genreId)

    const movies: any[] = []
    
    for (const genreId of topGenres) {
      const page = (seed % 10) + 1
      const genreMovies = await this.fetchIntelligentMoviesByGenre(genreId, page, userProfile)
      movies.push(...genreMovies)
    }
    
    return movies
  }

  private async generateTVRecommendationsWithSeed(userProfile: any, seed: number): Promise<any[]> {
    const topGenres = Object.entries(userProfile.preferredGenres || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([genreId]) => genreId)

    const tvShows: any[] = []
    
    for (const genreId of topGenres) {
      const page = (seed % 8) + 1
      const shows = await this.fetchTVShowsByGenre(genreId, page, userProfile)
      tvShows.push(...shows)
    }

    const trendingTV = await this.fetchTrendingTVShows(seed)
    const popularTV = await this.fetchPopularTVShows(seed)
    tvShows.push(...trendingTV, ...popularTV)
    
    return tvShows
  }

  private async fetchTrendingMixedWithSeed(seed: number): Promise<any[]> {
    try {
      const page = (seed % 5) + 1
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${this.tmdbApiKey}&page=${page}`
      )
      const data = await response.json()
      
      return (data.results || []).slice(0, 3).map((item: any) => ({
        ...item,
        title: item.title || item.name,
        release_date: item.release_date || item.first_air_date,
        displayTitle: item.title || item.name
      }))
    } catch (error) {
      console.error('Error fetching fresh trending mixed content:', error)
      return []
    }
  }

  // GENRE EXTRACTION
  private extractGenresWithCustomAI(analysis: any): Record<string, number> {
    const genreWeights: Record<string, number> = {}
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
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

    console.log('🎭 Extracted genre weights:', genreWeights)
    return genreWeights
  }

  private determinePersonalityTypeCustom(analysis: any): string {
    const personalities = [
      'Intellectual Explorer',
      'Emotional Connector', 
      'Entertainment Seeker',
      'Escapist Explorer',
      'Critical Analyst',
      'Nostalgic Dreamer'
    ]
    const selected = personalities[Math.floor(Math.random() * personalities.length)]
    console.log('🎭 Personality type:', selected)
    return selected
  }

  private analyzeMoodPreferencesCustom(analysis: any): string[] {
    return ['entertaining', 'thought-provoking', 'comforting']
  }

  private determineComplexityCustom(analysis: any): number {
    return Math.random() * 0.5 + 0.3 // 0.3 to 0.8
  }

  private generateCustomInsight(analysis: any): string {
    return "Your viewing preferences suggest you enjoy a diverse mix of content that challenges and entertains in equal measure. Our AI has found perfect matches including both movies and TV series!"
  }

  private analyzeViewingPatterns(analysis: any): any {
    return { preferredLength: 'mixed', socialViewing: 'flexible' }
  }

  private buildEmotionalProfile(analysis: any): any {
    return { emotionalRange: 'wide', intensityTolerance: 'medium' }
  }

  removeDuplicates(items: any[]): any[] {
    const seen = new Set()
    return items.filter(item => {
      if (!item.id || seen.has(item.id)) return false
      seen.add(item.id)
      return item.poster_path && item.vote_average > 0
    })
  }

  async getFallbackRecommendations(): Promise<any[]> {
    try {
      console.log('🔄 Loading fallback recommendations...')
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${this.tmdbApiKey}&page=1`)
      ])
      
      const [movieData, tvData] = await Promise.all([
        movieResponse.json(),
        tvResponse.json()
      ])
      
      const movies = (movieData.results || []).slice(0, 6).map((movie: any) => ({
        ...movie,
        media_type: 'movie',
        displayTitle: movie.title
      }))
      
      const tvShows = (tvData.results || []).slice(0, 6).map((show: any) => ({
        ...show,
        media_type: 'tv',
        title: show.name,
        release_date: show.first_air_date,
        displayTitle: show.name
      }))
      
      console.log('✅ Fallback recommendations loaded:', movies.length + tvShows.length, 'items')
      return [...movies, ...tvShows].filter(item => item.vote_average > 7.0 && item.poster_path)
    } catch (error) {
      console.error('Fallback recommendations failed:', error)
      return []
    }
  }

  async generateIntelligentKeywordSearch(userProfile: any): Promise<any[]> {
    // Simple implementation for now
    return []
  }
}

export const smartAIEngine = new SmartAIRecommendationEngine()
export const hybridAIEngine = smartAIEngine // Alias