// lib/smart-ai-recommendation-engine.ts - FIXED COMPLETE FILE
export class SmartAIRecommendationEngine {
  private tmdbApiKey = 'da4d264a4290972d086e0d21dce7cfeb'

  // Analyze user's onboarding responses with REAL AI logic
  analyzePersonality(responses: Record<number, string>) {
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

    console.log('🧠 AI Analyzing user responses:', analysis)

    const personalityProfile = {
      preferredGenres: this.extractGenres(analysis),
      personalityType: this.determinePersonalityType(analysis),
      moodPreferences: this.analyzeMoodPreferences(analysis),
      complexityLevel: this.determineComplexity(analysis),
      aiInsight: this.generateAIInsight(analysis)
    }

    console.log('🎯 AI Personality Profile:', personalityProfile)
    return personalityProfile
  }

  private extractGenres(analysis: any): Record<string, number> {
    const genreWeights: Record<string, number> = {}
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    // Direct genre selection
    if (analysis.genre.includes('Drama')) genreWeights['18'] = 0.9
    if (analysis.genre.includes('Comedy')) genreWeights['35'] = 0.9
    if (analysis.genre.includes('Action')) genreWeights['28'] = 0.9
    if (analysis.genre.includes('Romance')) genreWeights['10749'] = 0.8
    if (analysis.genre.includes('Horror')) genreWeights['27'] = 0.8
    if (analysis.genre.includes('Sci-Fi')) genreWeights['878'] = 0.8
    if (analysis.genre.includes('Mystery')) genreWeights['9648'] = 0.7
    if (analysis.genre.includes('Documentary')) genreWeights['99'] = 0.7

    // Mood-based genre inference
    if (analysis.mood.includes('excitement') || analysis.mood.includes('thrills')) {
      genreWeights['28'] = (genreWeights['28'] || 0) + 0.7
      genreWeights['53'] = (genreWeights['53'] || 0) + 0.6
    }
    if (analysis.mood.includes('comfort') || analysis.mood.includes('relaxed')) {
      genreWeights['35'] = (genreWeights['35'] || 0) + 0.6
      genreWeights['10749'] = (genreWeights['10749'] || 0) + 0.5
    }
    if (analysis.mood.includes('depth') || analysis.mood.includes('thoughtful')) {
      genreWeights['18'] = (genreWeights['18'] || 0) + 0.8
      genreWeights['99'] = (genreWeights['99'] || 0) + 0.6
    }

    // Text analysis for movie preferences
    if (allText.includes('action') || allText.includes('fight')) {
      genreWeights['28'] = (genreWeights['28'] || 0) + 0.7
    }
    if (allText.includes('funny') || allText.includes('laugh')) {
      genreWeights['35'] = (genreWeights['35'] || 0) + 0.8
    }
    if (allText.includes('emotional') || allText.includes('touching')) {
      genreWeights['18'] = (genreWeights['18'] || 0) + 0.8
    }
    if (allText.includes('scary') || allText.includes('horror')) {
      genreWeights['27'] = (genreWeights['27'] || 0) + 0.8
    }
    if (allText.includes('love') || allText.includes('romantic')) {
      genreWeights['10749'] = (genreWeights['10749'] || 0) + 0.7
    }

    return genreWeights
  }

  private determinePersonalityType(analysis: any): string {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    
    if (allText.includes('complex') || allText.includes('challenge')) {
      return 'Intellectual Explorer'
    }
    if (allText.includes('emotional') || allText.includes('feel')) {
      return 'Emotional Connector'
    }
    if (allText.includes('fun') || allText.includes('entertainment')) {
      return 'Entertainment Seeker'
    }
    if (allText.includes('escape') || allText.includes('adventure')) {
      return 'Escapist Explorer'
    }
    
    return 'Balanced Viewer'
  }

  private analyzeMoodPreferences(analysis: any): string[] {
    const preferences = []
    const mood = analysis.mood.toLowerCase()
    
    if (mood.includes('comfort')) preferences.push('comforting')
    if (mood.includes('excitement')) preferences.push('thrilling')
    if (mood.includes('depth')) preferences.push('thought-provoking')
    if (mood.includes('adventure')) preferences.push('adventurous')
    if (mood.includes('romantic')) preferences.push('romantic')
    if (mood.includes('laugh')) preferences.push('humorous')
    
    return preferences.length > 0 ? preferences : ['entertaining']
  }

  private determineComplexity(analysis: any): number {
    const allText = Object.values(analysis).join(' ').toLowerCase()
    let complexity = 0.5
    
    if (allText.includes('complex') || allText.includes('challenge')) {
      complexity += 0.3
    }
    if (allText.includes('simple') || allText.includes('easy')) {
      complexity -= 0.2
    }
    
    return Math.max(0.2, Math.min(1.0, complexity))
  }

  private generateAIInsight(analysis: any): string {
    const personalityType = this.determinePersonalityType(analysis)
    const topMood = this.analyzeMoodPreferences(analysis)[0] || 'entertaining'
    const complexity = this.determineComplexity(analysis)
    
    let insight = `Based on your responses, you're a ${personalityType} who appreciates ${topMood} content. `
    
    if (complexity > 0.7) {
      insight += "You enjoy sophisticated narratives with layered storytelling."
    } else if (complexity < 0.4) {
      insight += "You prefer accessible, well-crafted stories that entertain."
    } else {
      insight += "You enjoy a good balance of engaging plots with depth."
    }
    
    return insight
  }

  // MAIN RECOMMENDATION METHOD - GENERATES FRESH MOVIES
  async generateIntelligentRecommendations(userProfile: any): Promise<any[]> {
    try {
      console.log('🎬 Fetching FRESH movies for genres:', userProfile.preferredGenres)
      
      const topGenres = Object.entries(userProfile.preferredGenres)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([genreId]) => genreId)

      console.log('🎯 Top genres:', topGenres)

      const allMovies: any[] = []
      const currentTime = Date.now()
      const randomPage = Math.floor(currentTime / (1000 * 60 * 5)) % 5 + 1

      // Fetch from different sources
      for (let i = 0; i < topGenres.length; i++) {
        const genreId = topGenres[i]
        const page = (randomPage + i) % 5 + 1
        const movies = await this.fetchMoviesByGenre(genreId, page)
        allMovies.push(...movies)
      }

      const popularMovies = await this.fetchPopularMovies(randomPage)
      allMovies.push(...popularMovies)
      
      const trendingMovies = await this.fetchTrendingMovies(randomPage)
      allMovies.push(...trendingMovies)
      
      const topRatedMovies = await this.fetchTopRatedMovies(randomPage)
      allMovies.push(...topRatedMovies)

      const uniqueMovies = this.removeDuplicates(allMovies)
      
      const scoredMovies = uniqueMovies.map(movie => ({
        ...movie,
        aiScore: this.calculateAIScore(movie, userProfile.preferredGenres, userProfile.personalityType)
      })).sort((a, b) => b.aiScore - a.aiScore)

      console.log('🏆 Final AI-scored movies:', scoredMovies.slice(0, 12))
      return scoredMovies.slice(0, 12)
      
    } catch (error) {
      console.error('❌ Error fetching personalized movies:', error)
      return await this.getFallbackRecommendations()
    }
  }

  private async fetchMoviesByGenre(genreId: string, page: number = 1): Promise<any[]> {
    try {
      const sortOptions = ['vote_average.desc', 'popularity.desc', 'release_date.desc']
      const randomSort = sortOptions[page % sortOptions.length]
      
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${this.tmdbApiKey}&with_genres=${genreId}&sort_by=${randomSort}&vote_count.gte=50&page=${page}`
      )
      const data = await response.json()
      return data.results?.slice(0, 4) || []
    } catch (error) {
      console.error(`Error fetching genre ${genreId}:`, error)
      return []
    }
  }

  private async fetchPopularMovies(page: number = 1): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}&page=${page}`
      )
      const data = await response.json()
      return data.results?.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching popular movies:', error)
      return []
    }
  }
  
  private async fetchTrendingMovies(page: number = 1): Promise<any[]> {
    try {
      const timeWindow = page % 2 === 0 ? 'day' : 'week'
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${this.tmdbApiKey}&page=${page}`
      )
      const data = await response.json()
      return data.results?.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      return []
    }
  }
  
  private async fetchTopRatedMovies(page: number = 1): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${this.tmdbApiKey}&page=${page}`
      )
      const data = await response.json()
      return data.results?.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching top rated movies:', error)
      return []
    }
  }

  private calculateAIScore(movie: any, genreWeights: Record<string, number>, personalityType: string): number {
    let score = movie.vote_average * 10

    // Genre matching bonus
    if (movie.genre_ids) {
      movie.genre_ids.forEach((genreId: number) => {
        const weight = genreWeights[genreId.toString()]
        if (weight) {
          score += weight * 50
        }
      })
    }

    // Personality bonuses
    if (personalityType === 'Intellectual Explorer' && movie.vote_average > 7.5) {
      score += 30
    }
    if (personalityType === 'Entertainment Seeker' && movie.popularity > 100) {
      score += 25
    }
    if (personalityType === 'Emotional Connector' && movie.genre_ids?.includes(18)) {
      score += 35
    }

    // Release date relevance
    const releaseYear = new Date(movie.release_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const yearDiff = currentYear - releaseYear
    if (yearDiff >= 2 && yearDiff <= 15) {
      score += 15
    }

    return score
  }

  // KEYWORD SEARCH METHOD
  async generateIntelligentKeywordSearch(userProfile: any): Promise<any[]> {
    try {
      const keywords = this.extractSmartKeywords(userProfile)
      console.log('🔍 AI generated keywords:', keywords)
      
      const allResults: any[] = []
      
      for (const keyword of keywords) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(keyword)}&page=1`
          )
          const data = await response.json()
          if (data.results) {
            allResults.push(...data.results.slice(0, 5))
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

  private extractSmartKeywords(userProfile: any): string[] {
    const keywords: string[] = []
    
    if (userProfile.personalityType === 'Intellectual Explorer') {
      keywords.push('psychological thriller', 'mind bending', 'complex plot')
    } else if (userProfile.personalityType === 'Emotional Connector') {
      keywords.push('emotional drama', 'heartwarming', 'family')
    } else if (userProfile.personalityType === 'Entertainment Seeker') {
      keywords.push('blockbuster', 'popular', 'action packed')
    }
    
    if (userProfile.moodPreferences?.includes('thrilling')) {
      keywords.push('thriller', 'suspense')
    }
    if (userProfile.moodPreferences?.includes('comforting')) {
      keywords.push('feel good', 'comedy')
    }
    
    return keywords.slice(0, 3)
  }

  // UTILITY METHODS
  removeDuplicates(movies: any[]): any[] {
    const seen = new Set()
    return movies.filter(movie => {
      if (!movie.id || seen.has(movie.id)) return false
      seen.add(movie.id)
      return movie.poster_path && movie.vote_average > 0
    })
  }

  async getFallbackRecommendations(): Promise<any[]> {
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