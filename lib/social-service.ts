// lib/social-service.ts - FIXED FOR VERCEL DEPLOYMENT

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface UserProfile {
  id: string
  username: string
  name: string
  avatar?: string
  bio?: string
  favoriteGenres: string[]
  watchedCount: number
  ratingsCount: number
  followersCount: number
  followingCount: number
  isPrivate: boolean
  lastActive: Date
}

export interface SocialPost {
  id: string
  userId: string
  type: 'review' | 'rating' | 'watchlist_add' | 'recommendation'
  movieId: string
  content: string
  rating?: number
  spoilerLevel: 'none' | 'minor' | 'major'
  tags: string[]
  likes: number
  comments: number
  createdAt: Date
  user: UserProfile
}

export interface SafetyFilter {
  profanityLevel: 'strict' | 'moderate' | 'relaxed'
  spoilerProtection: boolean
  contentWarnings: boolean
  moderatedContent: boolean
}

export class SocialService {
  
  // Get personalized social feed
  async getSocialFeed(userId: string, filters: SafetyFilter): Promise<SocialPost[]> {
    try {
      // Get user's following list
      const following = await prisma.userInteraction.findMany({
        where: {
          userId,
          action: 'follow_user'
        }
      })

      const followingIds = following.map(f => f.target)

      // Get similar taste users (AI-powered similarity)
      const similarUsers = await this.findSimilarTasteUsers(userId)
      
      // Combine following + similar users
      const relevantUserIds = [...followingIds, ...similarUsers.slice(0, 10)]

      // Get posts from relevant users
      const posts = await prisma.rating.findMany({
        where: {
          userId: { in: relevantUserIds },
          review: { not: null }, // Only posts with reviews
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
          }
        },
        include: {
          user: true,
          movie: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // Convert to social posts and apply safety filters
      const socialPosts = posts.map(post => this.convertToSocialPost(post))
      
      return this.applySafetyFilters(socialPosts, filters)
    } catch (error) {
      console.error('Error getting social feed:', error)
      return []
    }
  }

  // Find users with similar taste using AI
  private async findSimilarTasteUsers(userId: string): Promise<string[]> {
    try {
      const userRatings = await prisma.rating.findMany({
        where: { userId },
        include: { movie: true },
        orderBy: { rating: 'desc' },
        take: 20 // Top 20 rated movies
      })

      if (userRatings.length < 5) return []

      // Find other users who rated similar movies highly
      const userTopMovies = userRatings.map(r => r.movieId).filter(Boolean) as string[]
      
      const similarRatings = await prisma.rating.findMany({
        where: {
          movieId: { in: userTopMovies },
          userId: { not: userId },
          rating: { gte: 4.0 } // High ratings only
        },
        include: { user: true }
      })

      // Count overlaps and score similarity
      const userScores: Record<string, number> = {}
      
      similarRatings.forEach(rating => {
        if (!userScores[rating.userId]) {
          userScores[rating.userId] = 0
        }
        userScores[rating.userId] += 1
      })

      // Return top similar users
      return Object.entries(userScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([userId]) => userId)
    } catch (error) {
      console.error('Error finding similar users:', error)
      return []
    }
  }

  private convertToSocialPost(post: any): SocialPost {
    return {
      id: post.id,
      userId: post.userId,
      type: 'review',
      movieId: post.movieId,
      content: post.review || '',
      rating: post.rating,
      spoilerLevel: this.detectSpoilerLevel(post.review || ''),
      tags: this.extractTags(post.review || ''),
      likes: 0, // Would come from likes table
      comments: 0, // Would come from comments table
      createdAt: post.createdAt,
      user: {
        id: post.user.id,
        username: post.user.username || post.user.name,
        name: post.user.name,
        avatar: post.user.image,
        bio: '',
        favoriteGenres: [],
        watchedCount: 0,
        ratingsCount: 0,
        followersCount: 0,
        followingCount: 0,
        isPrivate: false,
        lastActive: new Date()
      }
    }
  }

  // AI-powered content safety filters
  private applySafetyFilters(posts: SocialPost[], filters: SafetyFilter): SocialPost[] {
    return posts.filter(post => {
      // Profanity filter
      if (filters.profanityLevel === 'strict' && this.containsProfanity(post.content)) {
        return false
      }

      // Spoiler protection
      if (filters.spoilerProtection && post.spoilerLevel !== 'none') {
        return false
      }

      return true
    }).map(post => {
      // Clean content if needed
      if (filters.profanityLevel !== 'relaxed') {
        post.content = this.cleanContent(post.content, filters.profanityLevel)
      }

      return post
    })
  }

  private detectSpoilerLevel(content: string): 'none' | 'minor' | 'major' {
    const spoilerKeywords = {
      major: ['ending', 'dies', 'killed', 'plot twist', 'reveal', 'finale'],
      minor: ['surprise', 'unexpected', 'turns out', 'discovery']
    }

    const lowerContent = content.toLowerCase()
    
    if (spoilerKeywords.major.some(keyword => lowerContent.includes(keyword))) {
      return 'major'
    }
    
    if (spoilerKeywords.minor.some(keyword => lowerContent.includes(keyword))) {
      return 'minor'
    }

    return 'none'
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction - in production, use NLP
    const words = content.toLowerCase().split(/\s+/)
    const movieTerms = [
      'cinematography', 'acting', 'plot', 'character', 'dialogue', 
      'visual', 'emotional', 'thrilling', 'boring', 'amazing',
      'soundtrack', 'directing', 'script', 'effects', 'pacing'
    ]
    
    return words.filter(word => movieTerms.includes(word)).slice(0, 5)
  }

  private containsProfanity(content: string): boolean {
    // Simple profanity check - in production, use comprehensive filter
    const profanityList = ['damn', 'hell'] // Add more as needed
    const lowerContent = content.toLowerCase()
    return profanityList.some(word => lowerContent.includes(word))
  }

  private cleanContent(content: string, level: 'strict' | 'moderate'): string {
    if (level === 'strict') {
      // Replace profanity with asterisks
      return content.replace(/\b(damn|hell)\b/gi, '****')
    }
    return content
  }

  // IMDB Watchlist Integration - FIXED PRISMA ERROR
  async importIMDBWatchlist(userId: string, imdbData: any[]): Promise<number> {
    try {
      let importedCount = 0
      
      // Get or create default watchlist
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId, isDefault: true }
      })

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: {
            userId,
            name: 'My Watchlist',
            isDefault: true
          }
        })
      }

      for (const imdbItem of imdbData) {
        try {
          // Search for movie in our database by IMDB ID or title
          let movie = await prisma.movie.findFirst({
            where: {
              OR: [
                { tmdbId: imdbItem.tmdbId },
                { title: { equals: imdbItem.title, mode: 'insensitive' } }
              ]
            }
          })

          // If not found, create movie entry
          if (!movie) {
            movie = await this.createMovieFromIMDB(imdbItem)
          }

          if (movie) {
            // Add to watchlist if not already there
            const existingItem = await prisma.watchlistItem.findFirst({
              where: {
                watchlistId: watchlist.id,
                movieId: movie.id
              }
            })

            if (!existingItem) {
              // FIXED: Added missing userId field
              await prisma.watchlistItem.create({
                data: {
                  userId: userId, // FIXED: This was missing!
                  watchlistId: watchlist.id,
                  movieId: movie.id,
                  status: 'to_watch',
                  priority: imdbItem.priority || 0,
                  notes: `Imported from IMDB on ${new Date().toLocaleDateString()}`
                }
              })
              importedCount++
            }
          }
        } catch (error) {
          console.error(`Error importing ${imdbItem.title}:`, error)
        }
      }

      // Log import activity
      await prisma.userInteraction.create({
        data: {
          userId,
          action: 'imdb_import',
          target: 'watchlist',
          context: {
            importedCount,
            totalItems: imdbData.length,
            timestamp: new Date().toISOString()
          }
        }
      })

      return importedCount
    } catch (error) {
      console.error('Error importing IMDB watchlist:', error)
      return 0
    }
  }

  private async createMovieFromIMDB(imdbData: any) {
    try {
      // In production, you'd validate and enrich this data
      return await prisma.movie.create({
        data: {
          tmdbId: imdbData.tmdbId || 0,
          title: imdbData.title,
          originalTitle: imdbData.originalTitle,
          overview: imdbData.plot || '',
          releaseDate: imdbData.releaseDate ? new Date(imdbData.releaseDate) : null,
          posterPath: imdbData.posterPath,
          backdropPath: imdbData.backdropPath,
          genres: imdbData.genres || [],
          runtime: imdbData.runtime,
          voteAverage: imdbData.rating,
          voteCount: imdbData.voteCount || 0,
          popularity: imdbData.popularity || 0
        }
      })
    } catch (error) {
      console.error('Error creating movie from IMDB data:', error)
      return null
    }
  }

  // Community features
  async getTopReviewers(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<UserProfile[]> {
    const startDate = new Date()
    if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    const topReviewers = await prisma.rating.groupBy({
      by: ['userId'],
      where: {
        review: { not: null },
        createdAt: { gte: startDate }
      },
      _count: { review: true },
      orderBy: { _count: { review: 'desc' } },
      take: 10
    })

    const userProfiles = await Promise.all(
      topReviewers.map(async (reviewer) => {
        const user = await prisma.user.findUnique({
          where: { id: reviewer.userId },
          include: {
            ratings: { where: { review: { not: null } } },
            _count: {
              select: {
                ratings: true,
                interactions: {
                  where: { action: 'follow_user', target: reviewer.userId }
                }
              }
            }
          }
        })

        if (!user) return null

        return {
          id: user.id,
          username: user.username || user.name || 'Anonymous',
          name: user.name || 'Anonymous',
          avatar: user.image,
          bio: '', // Would come from user profile
          favoriteGenres: [], // Would be calculated
          watchedCount: user._count.ratings,
          ratingsCount: reviewer._count.review,
          followersCount: user._count.interactions,
          followingCount: 0, // Would be calculated
          isPrivate: false,
          lastActive: new Date()
        } as UserProfile
      })
    )

    return userProfiles.filter(Boolean) as UserProfile[]
  }

  // Additional helper methods (kept simple for deployment)
  async getSuggestedFriends(userId: string): Promise<UserProfile[]> {
    return [] // Simplified for now
  }

  private async calculateCompatibility(userId1: string, userId2: string): Promise<number> {
    return 0 // Simplified for now
  }

  async moderateContent(content: string, userId: string): Promise<{
    approved: boolean
    reasons: string[]
    moderatedContent?: string
  }> {
    return {
      approved: true,
      reasons: [],
      moderatedContent: content
    }
  }

  private isSpammy(content: string): boolean {
    return false // Simplified for now
  }

  async generateWeeklySocialDigest(userId: string): Promise<any> {
    return {
      friendsActivity: [],
      topReviews: [],
      suggestedFriends: [],
      yourStats: {
        watchedThisWeek: 0,
        reviewsWritten: 0,
        likesReceived: 0
      }
    }
  }

  private async getTopReviewsOfWeek(): Promise<SocialPost[]> {
    return []
  }

  private async getUserWeeklyStats(userId: string, since: Date) {
    return {
      watchedThisWeek: 0,
      reviewsWritten: 0,
      likesReceived: 0
    }
  }
}

export const socialService = new SocialService()