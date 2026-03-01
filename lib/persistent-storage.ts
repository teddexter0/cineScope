// lib/persistent-storage.ts - FIXED FAVORITE PEOPLE FUNCTIONALITY

// Persistent storage utility that actually works across page navigation
class PersistentStorage {
  private storagePrefix = 'cinescope_'
  
  // Get user-specific storage key
  private getUserKey(userEmail: string, type: string): string {
    const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_')
    return `${this.storagePrefix}${type}_${cleanEmail}`
  }

  // WATCHLIST OPERATIONS (existing code)
  getWatchlist(userEmail: string): any[] {
    try {
      if (typeof window === 'undefined') return []
      const key = this.getUserKey(userEmail, 'watchlist')
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading watchlist:', error)
      return []
    }
  }

  setWatchlist(userEmail: string, watchlist: any[]): void {
    try {
      if (typeof window === 'undefined') return
      const key = this.getUserKey(userEmail, 'watchlist')
      localStorage.setItem(key, JSON.stringify(watchlist))
      console.log('💾 Watchlist saved to localStorage:', watchlist.length, 'items')
    } catch (error) {
      console.error('Error saving watchlist:', error)
    }
  }

  addToWatchlist(userEmail: string, movie: any): boolean {
    try {
      const currentWatchlist = this.getWatchlist(userEmail)

      // Check if already exists
      const exists = currentWatchlist.find(item => item.movieId === movie.id?.toString())
      if (exists) {
        return false // Already in watchlist
      }

      const watchlistItem = {
        id: Date.now().toString(),
        movieId: movie.id?.toString(),
        title: movie.title || movie.name || movie.displayTitle,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        overview: movie.overview,
        media_type: movie.media_type || 'movie',
        status: 'to_watch' as 'to_watch' | 'watched',
        watchedAt: null as string | null,
        addedAt: new Date().toISOString()
      }

      currentWatchlist.push(watchlistItem)
      this.setWatchlist(userEmail, currentWatchlist)
      return true
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return false
    }
  }

  markAsWatched(userEmail: string, movieId: string): boolean {
    try {
      const currentWatchlist = this.getWatchlist(userEmail)
      const idx = currentWatchlist.findIndex(item => item.movieId === movieId)
      if (idx < 0) return false
      currentWatchlist[idx].status = 'watched'
      currentWatchlist[idx].watchedAt = new Date().toISOString()
      this.setWatchlist(userEmail, currentWatchlist)
      return true
    } catch (error) {
      console.error('Error marking as watched:', error)
      return false
    }
  }

  markAsToWatch(userEmail: string, movieId: string): boolean {
    try {
      const currentWatchlist = this.getWatchlist(userEmail)
      const idx = currentWatchlist.findIndex(item => item.movieId === movieId)
      if (idx < 0) return false
      currentWatchlist[idx].status = 'to_watch'
      currentWatchlist[idx].watchedAt = null
      this.setWatchlist(userEmail, currentWatchlist)
      return true
    } catch (error) {
      console.error('Error marking as to-watch:', error)
      return false
    }
  }

  removeFromWatchlist(userEmail: string, movieId: string): boolean {
    try {
      const currentWatchlist = this.getWatchlist(userEmail)
      const updatedWatchlist = currentWatchlist.filter(item => item.movieId !== movieId)
      this.setWatchlist(userEmail, updatedWatchlist)
      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return false
    }
  }

  // RATINGS OPERATIONS (existing code)
  getRatings(userEmail: string): any[] {
    try {
      if (typeof window === 'undefined') return []
      const key = this.getUserKey(userEmail, 'ratings')
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading ratings:', error)
      return []
    }
  }

  setRatings(userEmail: string, ratings: any[]): void {
    try {
      if (typeof window === 'undefined') return
      const key = this.getUserKey(userEmail, 'ratings')
      localStorage.setItem(key, JSON.stringify(ratings))
      console.log('💾 Ratings saved to localStorage:', ratings.length, 'items')
    } catch (error) {
      console.error('Error saving ratings:', error)
    }
  }

  addRating(userEmail: string, rating: any): boolean {
    try {
      const currentRatings = this.getRatings(userEmail)
      
      // Check if already rated
      const existingIndex = currentRatings.findIndex(item => item.movieId === rating.movieId?.toString())
      
      const ratingItem = {
        id: existingIndex >= 0 ? currentRatings[existingIndex].id : Date.now().toString(),
        movieId: rating.movieId?.toString(),
        title: rating.title,
        poster_path: rating.poster_path,
        vote_average: rating.vote_average,
        release_date: rating.release_date,
        rating: rating.rating,
        review: rating.review,
        media_type: rating.media_type || 'movie',
        createdAt: existingIndex >= 0 ? currentRatings[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        currentRatings[existingIndex] = ratingItem
      } else {
        currentRatings.push(ratingItem)
      }
      
      this.setRatings(userEmail, currentRatings)
      return true
    } catch (error) {
      console.error('Error adding rating:', error)
      return false
    }
  }

  // FAVORITE PEOPLE OPERATIONS - COMPLETELY FIXED
  getFavoritePeople(userEmail: string): any[] {
    try {
      if (typeof window === 'undefined') return []
      const key = this.getUserKey(userEmail, 'favorite_people')
      const stored = localStorage.getItem(key)
      const parsed = stored ? JSON.parse(stored) : []
      
      console.log('📖 Reading favorite people from localStorage:', {
        key,
        count: parsed.length,
        sample: parsed.slice(0, 2).map((p: any) => ({ id: p.id, name: p.name }))
      })
      
      return parsed
    } catch (error) {
      console.error('Error reading favorite people:', error)
      return []
    }
  }

  setFavoritePeople(userEmail: string, people: any[]): void {
    try {
      if (typeof window === 'undefined') return
      const key = this.getUserKey(userEmail, 'favorite_people')
      
      // FIXED: Ensure data is properly serialized
      const cleanPeople = people.map(person => ({
        id: person.id,
        name: person.name || 'Unknown Person',
        profile_path: person.profile_path || null,
        known_for_department: person.known_for_department || 'Acting',
        known_for: person.known_for || [],
        popularity: person.popularity || 0,
        addedAt: person.addedAt || new Date().toISOString()
      }))
      
      localStorage.setItem(key, JSON.stringify(cleanPeople))
      
      console.log('💾 Favorite people saved to localStorage:', {
        key,
        count: cleanPeople.length,
        sample: cleanPeople.slice(0, 2).map(p => ({ id: p.id, name: p.name }))
      })
    } catch (error) {
      console.error('Error saving favorite people:', error)
    }
  }

  addFavoritePerson(userEmail: string, person: any): boolean {
    try {
      console.log('🧑‍💼 Adding person to favorites:', {
        userEmail,
        personId: person.id,
        personName: person.name
      })
      
      const currentFavorites = this.getFavoritePeople(userEmail)
      
      // FIXED: Check if already exists by ID (number comparison)
      const exists = currentFavorites.find(item => item.id === person.id)
      if (exists) {
        console.log('❌ Person already in favorites:', person.name)
        return false // Already in favorites
      }

      // FIXED: Create complete person object with all required fields
      const favoriteItem = {
        id: person.id, // Keep original ID as number
        name: person.name || 'Unknown Person',
        profile_path: person.profile_path || null,
        known_for_department: person.known_for_department || 'Acting',
        known_for: Array.isArray(person.known_for) ? person.known_for : [],
        popularity: typeof person.popularity === 'number' ? person.popularity : 0,
        addedAt: new Date().toISOString()
      }

      console.log('✅ Creating favorite person item:', favoriteItem)

      const updatedFavorites = [...currentFavorites, favoriteItem]
      this.setFavoritePeople(userEmail, updatedFavorites)
      
      console.log('🎉 Person successfully added to favorites:', {
        name: favoriteItem.name,
        totalFavorites: updatedFavorites.length
      })
      
      return true
    } catch (error) {
      console.error('❌ Error adding favorite person:', error)
      return false
    }
  }

  removeFavoritePerson(userEmail: string, personId: number): boolean {
    try {
      console.log('🗑️ Removing person from favorites:', { userEmail, personId })
      
      const currentFavorites = this.getFavoritePeople(userEmail)
      const personToRemove = currentFavorites.find(item => item.id === personId)
      
      if (!personToRemove) {
        console.log('❌ Person not found in favorites:', personId)
        return false
      }
      
      const updatedFavorites = currentFavorites.filter(item => item.id !== personId)
      this.setFavoritePeople(userEmail, updatedFavorites)
      
      console.log('✅ Person removed from favorites:', {
        name: personToRemove.name,
        remainingFavorites: updatedFavorites.length
      })
      
      return true
    } catch (error) {
      console.error('❌ Error removing favorite person:', error)
      return false
    }
  }

  // UTILITY: Check if person is already in favorites
  isPersonInFavorites(userEmail: string, personId: number): boolean {
    try {
      const favorites = this.getFavoritePeople(userEmail)
      return favorites.some(person => person.id === personId)
    } catch (error) {
      console.error('Error checking if person is in favorites:', error)
      return false
    }
  }

  // Get stats
  getUserStats(userEmail: string): any {
    const watchlist = this.getWatchlist(userEmail)
    const ratings = this.getRatings(userEmail)
    const favoritePeople = this.getFavoritePeople(userEmail)

    return {
      watchlistCount: watchlist.length,
      ratingsCount: ratings.length,
      favoritePeopleCount: favoritePeople.length,
      averageRating: ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
        : '0.0'
    }
  }

  // DEBUGGING: Clear all data for user (useful for testing)
  clearUserData(userEmail: string): void {
    if (typeof window === 'undefined') return
    
    const types = ['watchlist', 'ratings', 'favorite_people']
    types.forEach(type => {
      const key = this.getUserKey(userEmail, type)
      localStorage.removeItem(key)
    })
    
    console.log('🧹 Cleared all data for user:', userEmail)
  }

  // DEBUGGING: Get all stored keys for user
  getUserKeys(userEmail: string): string[] {
    if (typeof window === 'undefined') return []
    
    const userPrefix = this.getUserKey(userEmail, '')
    const keys = Object.keys(localStorage).filter(key => key.startsWith(userPrefix))
    
    console.log('🔑 User storage keys:', keys)
    return keys
  }
}

export const persistentStorage = new PersistentStorage()