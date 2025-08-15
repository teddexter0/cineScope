const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  vote_average: number
  genre_ids: number[]
}

export class MovieService {
  
  // Get trending movies with posters
  static async getTrendingMovies(): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`
      )
      const data = await response.json()
      return data.results.slice(0, 12) // Get 12 movies
    } catch (error) {
      console.error('Error fetching movies:', error)
      return []
    }
  }

  // Search movies by title
  static async searchMovies(query: string): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      return data.results
    } catch (error) {
      console.error('Error searching movies:', error)
      return []
    }
  }

  // Get movie poster URL
  static getPosterUrl(posterPath: string): string {
    if (!posterPath) return '/placeholder-poster.jpg' // Add a placeholder
    return `${TMDB_IMAGE_BASE}${posterPath}`
  }

  // Get backdrop URL
  static getBackdropUrl(backdropPath: string): string {
    if (!backdropPath) return '/placeholder-backdrop.jpg'
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`
  }

  // Get popular movies by genre
  static async getMoviesByGenre(genreId: number): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
      )
      const data = await response.json()
      return data.results.slice(0, 6)
    } catch (error) {
      console.error('Error fetching movies by genre:', error)
      return []
    }
  }
}

// Genre mapping
export const GENRES = {
  28: 'Action',
  12: 'Adventure', 
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
}