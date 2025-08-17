const TMDB_BASE_URL = process.env.TMDB_BASE_URL!
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE!

class TMDBService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY is required')
    }
  }

  private async request(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.set('api_key', this.apiKey)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getMovie(movieId: number) {
    return this.request(`/movie/${movieId}`, {
      append_to_response: 'credits,keywords,recommendations'
    })
  }

  async searchMovies(query: string, page = 1) {
    return this.request('/search/movie', { query, page })
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week') {
    return this.request(`/trending/movie/${timeWindow}`)
  }

  async getPopularMovies(page = 1) {
    return this.request('/movie/popular', { page })
  }

  async getUpcomingMovies(page = 1) {
    return this.request('/movie/upcoming', { page })
  }

  getImageUrl(path: string, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
  }

  getPosterUrl(path: string) {
    return this.getImageUrl(path, 'w500')
  }

  getBackdropUrl(path: string) {
    return this.getImageUrl(path, 'w780')
  }

  formatMovieForDB(tmdbMovie: any) {
    return {
      tmdbId: tmdbMovie.id,
      title: tmdbMovie.title,
      originalTitle: tmdbMovie.original_title,
      overview: tmdbMovie.overview,
      releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      genres: tmdbMovie.genres,
      runtime: tmdbMovie.runtime,
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
    }
  }
}

export const tmdbService = new TMDBService()