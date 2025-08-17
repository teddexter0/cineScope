// lib/persistent-storage.ts - FIXED CLIENT-SIDE PERSISTENCE

// Persistent storage utility that actually works across page navigation
class PersistentStorage {
  private storagePrefix = 'cinescope_'
  
  // Get user-specific storage key
  private getUserKey(userEmail: string, type: string): string {
    const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_')
    return `${this.storagePrefix}${type}_${cleanEmail}`
  }

  // Watchlist operations
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

  // Ratings operations
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

  // Favorite people operations
  getFavoritePeople(userEmail: string): any[] {
    try {
      if (typeof window === 'undefined') return []
      const key = this.getUserKey(userEmail, 'favorite_people')
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading favorite people:', error)
      return []
    }
  }

  setFavoritePeople(userEmail: string, people: any[]): void {
    try {
      if (typeof window === 'undefined') return
      const key = this.getUserKey(userEmail, 'favorite_people')
      localStorage.setItem(key, JSON.stringify(people))
      console.log('💾 Favorite people saved to localStorage:', people.length, 'items')
    } catch (error) {
      console.error('Error saving favorite people:', error)
    }
  }

  addFavoritePerson(userEmail: string, person: any): boolean {
    try {
      const currentFavorites = this.getFavoritePeople(userEmail)
      
      // Check if already exists
      const exists = currentFavorites.find(item => item.id === person.id)
      if (exists) {
        return false // Already in favorites
      }

      const favoriteItem = {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path,
        known_for_department: person.known_for_department || 'Acting',
        known_for: person.known_for || [],
        popularity: person.popularity || 0,
        addedAt: new Date().toISOString()
      }

      currentFavorites.push(favoriteItem)
      this.setFavoritePeople(userEmail, currentFavorites)
      return true
    } catch (error) {
      console.error('Error adding favorite person:', error)
      return false
    }
  }

  removeFavoritePerson(userEmail: string, personId: number): boolean {
    try {
      const currentFavorites = this.getFavoritePeople(userEmail)
      const updatedFavorites = currentFavorites.filter(item => item.id !== personId)
      this.setFavoritePeople(userEmail, updatedFavorites)
      return true
    } catch (error) {
      console.error('Error removing favorite person:', error)
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
}

export const persistentStorage = new PersistentStorage()