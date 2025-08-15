// lib/ai-recommendation-engine.ts - REAL AI Analysis

export class RealAIRecommendationEngine {
  
  // Analyze user's onboarding responses with real AI logic
  analyzePersonality(responses: Record<number, string>) {
    const analysis = {
      favoriteMovie: responses[1] || '',
      movieReasoning: responses[2] || '',
      relatedCharacter: responses[3] || '',
      characterReasoning: responses[4] || '',
      favoriteDirector: responses[5] || '',
      mood: responses[6] || '',
      scenario: responses[7] || '',
      timing: responses[8] || ''
    }

    // AI Analysis based on responses
    const personalityProfile = {
      preferredGenres: this.extractGenres(analysis),
      personalityType: this.determinePersonalityType(analysis),
      moodPreferences: this.analyzeMoodPreferences(analysis),
      complexityLevel: this.determineComplexity(analysis),
      socialViewing: this.determineSocialPreference(analysis),
      optimalTiming: this.extractOptimalTiming(analysis)
    }

    return personalityProfile
  }

  private extractGenres(analysis: any): Record<string, number> {
    const genreWeights: Record<string, number> = {}
    
    // Analyze favorite movie reasoning
    const reasoning = analysis.movieReasoning.toLowerCase()
    const character = analysis.characterReasoning.toLowerCase()
    const mood = analysis.mood.toLowerCase()

    // Genre detection based on keywords
    if (reasoning.includes('action') || reasoning.includes('fight') || reasoning.includes('adventure')) {
      genreWeights['Action'] = 0.9
    }
    if (reasoning.includes('funny') || reasoning.includes('laugh') || reasoning.includes('comedy') || mood.includes('laugh')) {
      genreWeights['Comedy'] = 0.9
    }
    if (reasoning.includes('emotional') || reasoning.includes('cry') || reasoning.includes('touching') || character.includes('emotion')) {
      genreWeights['Drama'] = 0.9
    }
    if (reasoning.includes('scary') || reasoning.includes('horror') || reasoning.includes('suspense')) {
      genreWeights['Horror'] = 0.8
    }
    if (reasoning.includes('love') || reasoning.includes('romantic') || mood.includes('romantic')) {
      genreWeights['Romance'] = 0.8
    }
    if (reasoning.includes('space') || reasoning.includes('future') || reasoning.includes('sci-fi')) {
      genreWeights['Science Fiction'] = 0.8
    }
    if (reasoning.includes('fantasy') || reasoning.includes('magic') || reasoning.includes('wizard')) {
      genreWeights['Fantasy'] = 0.8
    }

    // Director-based genre preferences
    const director = analysis.favoriteDirector.toLowerCase()
    if (director.includes('nolan')) {
      genreWeights['Thriller'] = 0.9
      genreWeights['Science Fiction'] = 0.8
    }
    if (director.includes('tarantino')) {
      genreWeights['Crime'] = 0.9
      genreWeights['Action'] = 0.8
    }
    if (director.includes('ghibli') || director.includes('miyazaki')) {
      genreWeights['Animation'] = 0.9
      genreWeights['Family'] = 0.8
    }

    return genreWeights
  }

  private determinePersonalityType(analysis: any): string {
    const reasoning = analysis.movieReasoning.toLowerCase()
    const character = analysis.characterReasoning.toLowerCase()
    const scenario = analysis.scenario.toLowerCase()

    if (reasoning.includes('think') || reasoning.includes('complex') || reasoning.includes('mind')) {
      return 'Intellectual Viewer'
    }
    if (reasoning.includes('feel') || reasoning.includes('emotional') || character.includes('relate')) {
      return 'Emotional Connector'
    }
    if (reasoning.includes('fun') || reasoning.includes('entertainment') || scenario.includes('friends')) {
      return 'Social Entertainer'
    }
    if (reasoning.includes('escape') || reasoning.includes('different') || scenario.includes('solo')) {
      return 'Escapist Explorer'
    }
    
    return 'Balanced Viewer'
  }

  private analyzeMoodPreferences(analysis: any): string[] {
    const mood = analysis.mood.toLowerCase()
    const scenario = analysis.scenario.toLowerCase()
    const preferences = []

    if (mood.includes('chill') || mood.includes('comfort')) preferences.push('relaxing')
    if (mood.includes('energy') || mood.includes('excitement')) preferences.push('energetic')
    if (mood.includes('thoughtful') || mood.includes('depth')) preferences.push('contemplative')
    if (mood.includes('adventure') || mood.includes('thrill')) preferences.push('adventurous')
    if (mood.includes('romantic') || mood.includes('feels')) preferences.push('romantic')
    if (mood.includes('laugh') || mood.includes('fun')) preferences.push('lighthearted')

    return preferences
  }

  private determineComplexity(analysis: any): number {
    const reasoning = analysis.movieReasoning.toLowerCase()
    const character = analysis.characterReasoning.toLowerCase()
    
    let complexity = 0.5 // baseline
    
    if (reasoning.includes('complex') || reasoning.includes('layered') || reasoning.includes('deep')) {
      complexity += 0.3
    }
    if (reasoning.includes('simple') || reasoning.includes('straightforward') || reasoning.includes('easy')) {
      complexity -= 0.2
    }
    if (character.includes('complex') || character.includes('flawed') || character.includes('development')) {
      complexity += 0.2
    }
    
    return Math.max(0.1, Math.min(1.0, complexity))
  }

  private determineSocialPreference(analysis: any): string {
    const scenario = analysis.scenario.toLowerCase()
    
    if (scenario.includes('friends') || scenario.includes('family') || scenario.includes('date')) {
      return 'social'
    }
    if (scenario.includes('solo') || scenario.includes('alone') || scenario.includes('pajamas')) {
      return 'solo'
    }
    
    return 'flexible'
  }

  private extractOptimalTiming(analysis: any): string[] {
    const timing = analysis.timing.toLowerCase()
    const timingPrefs = []
    
    if (timing.includes('morning')) timingPrefs.push('morning')
    if (timing.includes('afternoon')) timingPrefs.push('afternoon')
    if (timing.includes('evening')) timingPrefs.push('evening')
    if (timing.includes('night')) timingPrefs.push('night')
    if (timing.includes('weekend')) timingPrefs.push('weekend')
    
    return timingPrefs.length > 0 ? timingPrefs : ['evening'] // default
  }

  // Generate SMART recommendations based on personality
  async generateSmartRecommendations(
    personalityProfile: any,
    context: string = 'general'
  ): Promise<{ movieIds: number[], reasoning: string }> {
    try {
      const topGenres = Object.entries(personalityProfile.preferredGenres)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 2)
        .map(([genre]) => genre)

      // Get genre IDs for TMDB
      const genreIds = this.getGenreIds(topGenres)
      
      // Fetch movies based on user's preferred genres
      let movieIds: number[] = []
      
      if (genreIds.length > 0) {
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreIds.join(',')}&sort_by=vote_average.desc&vote_count.gte=100&page=1`
        )
        const data = await response.json()
        
        if (data.results) {
          movieIds = data.results.slice(0, 12).map((movie: any) => movie.id)
        }
      }
      
      // Fallback to trending if genre search fails
      if (movieIds.length === 0) {
        const trendingResponse = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`
        )
        const trendingData = await trendingResponse.json()
        movieIds = trendingData.results?.slice(0, 12).map((movie: any) => movie.id) || []
      }

      const reasoning = `Based on your responses, you're a ${personalityProfile.personalityType} who loves ${topGenres.join(' and ')} films. Your preference for ${personalityProfile.moodPreferences.join(', ')} content and ${personalityProfile.socialViewing} viewing makes these perfect matches for you!`

      return { movieIds, reasoning }
      
    } catch (error) {
      console.error('Error generating smart recommendations:', error)
      return { 
        movieIds: [], 
        reasoning: "We're fine-tuning your recommendations. Please try again!" 
      }
    }
  }

  private getGenreIds(genreNames: string[]): number[] {
    const genreMap: Record<string, number> = {
      'Action': 28,
      'Adventure': 12,
      'Animation': 16,
      'Comedy': 35,
      'Crime': 80,
      'Documentary': 99,
      'Drama': 18,
      'Family': 10751,
      'Fantasy': 14,
      'History': 36,
      'Horror': 27,
      'Music': 10402,
      'Mystery': 9648,
      'Romance': 10749,
      'Science Fiction': 878,
      'TV Movie': 10770,
      'Thriller': 53,
      'War': 10752,
      'Western': 37
    }

    return genreNames.map(name => genreMap[name]).filter(Boolean)
  }
}

export const realAIEngine = new RealAIRecommendationEngine()