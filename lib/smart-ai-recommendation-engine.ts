// lib/smart-ai-recommendation-engine.ts - REAL AI THAT SEARCHES INTELLIGENTLY
export class SmartAIRecommendationEngine {
  private tmdbApiKey = 'da4d264a4290972d086e0d21dce7cfeb'

  // SMART MOVIE DISCOVERY - AI searches for movies the user would love
  async generateIntelligentRecommendations(userProfile: any): Promise<any[]> {
    try {
      console.log('🧠 AI starting intelligent movie discovery...')
      
      const allMovies: any[] = []
      
      // 1. SMART KEYWORD SEARCH based on user personality
      const smartKeywords = this.generateSmartKeywords(userProfile)
      for (const keyword of smartKeywords) {
        const keywordMovies = await this.searchMoviesByKeyword(keyword)
        allMovies.push(...keywordMovies)
      }
      
      // 2. GENRE-BASED INTELLIGENT DISCOVERY
      const genreMovies = await this.discoverMoviesByGenres(userProfile.preferredGenres)
      allMovies.push(...genreMovies)
      
      // 3. YEAR-BASED DISCOVERY (based on user's favorite movie era)
      const eraMovies = await this.discoverMoviesByEra(userProfile)
      allMovies.push(...eraMovies)
      
      // 4. SIMILAR MOVIES TO USER'S FAVORITES
      const similarMovies = await this.findSimilarMovies(userProfile)
      allMovies.push(...similarMovies)
      
      // 5. TRENDING MOVIES FILTERED BY TASTE
      const trendingFiltered = await this.getPersonalizedTrending(userProfile)
      allMovies.push(...trendingFiltered)
      
      // Remove duplicates and apply AI scoring
      const uniqueMovies = this.removeDuplicates(allMovies)
      const aiScoredMovies = uniqueMovies.map(movie => ({
        ...movie,
        aiScore: this.calculateAdvancedAIScore(movie, userProfile),
        aiReason: this.generateAIReason(movie, userProfile)
      }))
      
      // Sort by AI intelligence and return top picks
      const finalRecommendations = aiScoredMovies
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 12)
      
      console.log('🎯 AI discovered', finalRecommendations.length, 'intelligent recommendations')
      return finalRecommendations
      
    } catch (error) {
      console.error('❌ AI recommendation error:', error)
      return await this.getFallbackRecommendations()
    }
  }

  // GENERATE SMART SEARCH KEYWORDS based on user personality
  private generateSmartKeywords(userProfile: any): string[] {
    const keywords = []
    
    // Based on personality type
    if (userProfile.personalityType === 'Intellectual Explorer') {
      keywords.push('psychological', 'complex', 'philosophical', 'mind-bending', 'cerebral')
    } else if (userProfile.personalityType === 'Emotional Connector') {
      keywords.push('heartwarming', 'emotional', 'touching', 'relationship', 'family')
    } else if (userProfile.personalityType === 'Entertainment Seeker') {
      keywords.push('fun', 'entertaining', 'popular', 'blockbuster', 'exciting')
    } else if (userProfile.personalityType === 'Escapist Explorer') {
      keywords.push('adventure', 'fantasy', 'escape', 'magical', 'journey')
    }
    
    // Based on mood preferences
    if (userProfile.moodPreferences?.includes('thrilling')) {
      keywords.push('thriller', 'suspense', 'intense', 'edge-of-seat')
    }
    if (userProfile.moodPreferences?.includes('comforting')) {
      keywords.push('feel-good', 'uplifting', 'positive', 'hopeful')
    }
    
    // Based on complexity level
    if (userProfile.complexityLevel > 0.7) {
      keywords.push('sophisticated', 'layered', 'nuanced', 'artistic')
    } else if (userProfile.complexityLevel < 0.4) {
      keywords.push('straightforward', 'accessible', 'clear', 'simple')
    }
    
    return keywords.slice(0, 3) // Top 3 most relevant keywords
  }

  // SEARCH MOVIES BY INTELLIGENT KEYWORDS
  private async searchMoviesByKeyword(keyword: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(keyword)}&page=1`
      )
      const data = await response.json()
      return (data.results || [])
        .filter((movie: any) => movie.vote_average > 6.5 && movie.poster_path)
        .slice(0, 4)
    } catch (error) {
      console.error(`Error searching keyword ${keyword}:`, error)
      return []
    }
  }

  // DISCOVER MOVIES BY GENRE COMBINATIONS
  private async discoverMoviesByGenres(preferredGenres: Record<string, number>): Promise<any[]> {
    try {
      const topGenres = Object.entries(preferredGenres)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([genreId]) => genreId)

      if (topGenres.length === 0) return []

      // Try different combinations and years for variety
      const pages = [1, 2, 3]
      const years = [2023, 2022, 2021, 2020, 2019]
      const allGenreMovies = []

      for (const page of pages) {
        for (const year of years.slice(0, 2)) {
          const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&with_genres=${topGenres.join(',')}&year=${year}&sort_by=vote_average.desc&vote_count.gte=50&page=${page}`
          )
          const data = await response.json()
          if (data.results) {
            allGenreMovies.push(...data.results.slice(0, 3))
          }
        }
      }

      return allGenreMovies
    } catch (error) {
      console.error('Error discovering by genres:', error)
      return []
    }
  }

  // DISCOVER MOVIES BY ERA/DECADE
  private async discoverMoviesByEra(userProfile: any): Promise<any[]> {
    try {
      // Determine user's preferred era from their responses
      const currentYear = new Date().getFullYear()
      const eras = [
        { start: currentYear - 5, end: currentYear, weight: 0.8 }, // Recent
        { start: 2010, end: 2019, weight: 0.9 }, // 2010s
        { start: 2000, end: 2009, weight: 0.7 }, // 2000s
        { start: 1990, end: 1999, weight: 0.6 }, // 90s
        { start: 1980, end: 1989, weight: 0.5 }  // 80s
      ]

      const allEraMovies = []
      
      for (const era of eras) {
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&primary_release_date.gte=${era.start}-01-01&primary_release_date.lte=${era.end}-12-31&sort_by=vote_average.desc&vote_count.gte=100&page=1`
        )
        const data = await response.json()
        if (data.results) {
          allEraMovies.push(...data.results.slice(0, Math.floor(era.weight * 4)))
        }
      }

      return allEraMovies
    } catch (error) {
      console.error('Error discovering by era:', error)
      return []
    }
  }

  // FIND SIMILAR MOVIES (if user mentioned favorites)
  private async findSimilarMovies(userProfile: any): Promise<any[]> {
    try {
      // If user mentioned specific movies, find similar ones
      const favoriteMovie = userProfile.favoriteMovie?.toLowerCase() || ''
      
      if (favoriteMovie.length < 3) return []

      // Search for the mentioned movie first
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(favoriteMovie)}&page=1`
      )
      const searchData = await searchResponse.json()
      
      if (searchData.results && searchData.results.length > 0) {
        const movieId = searchData.results[0].id
        
        // Get similar movies
        const similarResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${this.tmdbApiKey}&page=1`
        )
        const similarData = await similarResponse.json()
        
        return (similarData.results || []).slice(0, 6)
      }

      return []
    } catch (error) {
      console.error('Error finding similar movies:', error)
      return []
    }
  }

  // GET PERSONALIZED TRENDING MOVIES
  private async getPersonalizedTrending(userProfile: any): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${this.tmdbApiKey}`
      )
      const data = await response.json()
      
      // Filter trending movies by user preferences
      return (data.results || [])
        .filter((movie: any) => this.matchesUserTaste(movie, userProfile))
        .slice(0, 4)
    } catch (error) {
      console.error('Error getting personalized trending:', error)
      return []
    }
  }

  // ADVANCED AI SCORING ALGORITHM
  private calculateAdvancedAIScore(movie: any, userProfile: any): number {
    let score = 0

    // Base quality score
    score += movie.vote_average * 8
    score += Math.min(movie.popularity / 100, 20)

    // Genre matching (powerful boost)
    if (movie.genre_ids && userProfile.preferredGenres) {
      movie.genre_ids.forEach((genreId: number) => {
        const weight = userProfile.preferredGenres[genreId.toString()]
        if (weight) {
          score += weight * 60 // Big boost for genre match
        }
      })
    }

    // Personality type bonuses
    if (userProfile.personalityType === 'Intellectual Explorer') {
      if (movie.vote_average > 7.5) score += 25
      if (movie.overview?.includes('complex') || movie.overview?.includes('mind')) score += 15
    }
    
    if (userProfile.personalityType === 'Emotional Connector') {
      if (movie.genre_ids?.includes(18)) score += 30 // Drama bonus
      if (movie.overview?.includes('heart') || movie.overview?.includes('emotion')) score += 20
    }
    
    if (userProfile.personalityType === 'Entertainment Seeker') {
      if (movie.popularity > 200) score += 25
      if (movie.genre_ids?.includes(28) || movie.genre_ids?.includes(35)) score += 20
    }

    // Complexity matching
    const complexityWords = ['complex', 'intricate', 'layered', 'sophisticated', 'nuanced']
    const simpleWords = ['fun', 'entertaining', 'light', 'easy', 'accessible']
    
    if (userProfile.complexityLevel > 0.7) {
      if (complexityWords.some(word => movie.overview?.toLowerCase().includes(word))) {
        score += 25
      }
    } else if (userProfile.complexityLevel < 0.4) {
      if (simpleWords.some(word => movie.overview?.toLowerCase().includes(word))) {
        score += 25
      }
    }

    // Recency bonus (but not too recent)
    const releaseYear = new Date(movie.release_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const yearDiff = currentYear - releaseYear
    
    if (yearDiff >= 1 && yearDiff <= 10) {
      score += 15 // Sweet spot
    }

    // Quality thresholds
    if (movie.vote_average < 6.0) score -= 30
    if (movie.vote_count < 100) score -= 20

    return Math.max(0, score)
  }

  // GENERATE AI REASONING
  private generateAIReason(movie: any, userProfile: any): string {
    const reasons = []
    
    // Genre reasons
    if (movie.genre_ids && userProfile.preferredGenres) {
      const matchedGenres = movie.genre_ids.filter((id: number) => 
        userProfile.preferredGenres[id.toString()] > 0.6
      )
      if (matchedGenres.length > 0) {
        reasons.push("matches your favorite genres")
      }
    }

    // Personality reasons
    if (userProfile.personalityType === 'Intellectual Explorer' && movie.vote_average > 7.5) {
      reasons.push("critically acclaimed for your thoughtful taste")
    }
    
    if (userProfile.personalityType === 'Emotional Connector' && movie.genre_ids?.includes(18)) {
      reasons.push("emotional depth you love")
    }

    // Quality reasons
    if (movie.vote_average > 8.0) {
      reasons.push("exceptional ratings")
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push("AI-selected for your unique taste")
    }

    return reasons.slice(0, 2).join(" and ")
  }

  // HELPER METHODS
  private matchesUserTaste(movie: any, userProfile: any): boolean {
    // Check if movie aligns with user preferences
    if (movie.vote_average < 6.0) return false
    
    if (userProfile.preferredGenres && movie.genre_ids) {
      const hasMatchingGenre = movie.genre_ids.some((id: number) => 
        userProfile.preferredGenres[id.toString()] > 0.5
      )
      if (hasMatchingGenre) return true
    }

    // If highly rated, include regardless
    return movie.vote_average > 7.5
  }

  private removeDuplicates(movies: any[]): any[] {
    const seen = new Set()
    return movies.filter(movie => {
      if (!movie.id || seen.has(movie.id)) return false
      seen.add(movie.id)
      return movie.poster_path && movie.vote_average > 0
    })
  }

  public async getFallbackRecommendations(): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}&page=1`
      )
      const data = await response.json()
      return (data.results || [])
        .filter((movie: any) => movie.vote_average > 7.0)
        .slice(0, 12)
    } catch (error) {
      console.error('Fallback recommendations failed:', error)
      return []
    }
  }
}

export const smartAIEngine = new SmartAIRecommendationEngine()