
import { useState, useCallback } from 'react'

export const useWatchlist = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToWatchlist = useCallback(async (movie: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          overview: movie.overview
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to watchlist')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getWatchlist = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlist')
      const data = await response.json()
      return data.watchlist || []
    } catch (error) {
      console.error('Error getting watchlist:', error)
      return []
    }
  }, [])

  return { addToWatchlist, getWatchlist, loading, error }
}
