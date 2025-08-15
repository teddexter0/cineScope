// lib/social-service.ts
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

  // IMDB Watchlist Integration
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
              await prisma.watchlistItem.create({
                data: {
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

  // Friend recommendations based on taste similarity
  async getSuggestedFriends(userId: string): Promise<UserProfile[]> {
    try {
      const similarUsers = await this.findSimilarTasteUsers(userId)
      
      // Get detailed profiles for similar users
      const profiles = await Promise.all(
        similarUsers.slice(0, 8).map(async (similarUserId) => {
          const user = await prisma.user.findUnique({
            where: { id: similarUserId },
            include: {
              ratings: { take: 5, orderBy: { rating: 'desc' } },
              _count: { select: { ratings: true } }
            }
          })

          if (!user) return null

          // Calculate compatibility score
          const compatibility = await this.calculateCompatibility(userId, similarUserId)

          return {
            id: user.id,
            username: user.username || user.name || 'Movie Lover',
            name: user.name || 'Movie Lover',
            avatar: user.image,
            bio: `${compatibility}% taste match • ${user._count.ratings} movies rated`,
            favoriteGenres: [], // Would extract from ratings
            watchedCount: user._count.ratings,
            ratingsCount: user._count.ratings,
            followersCount: 0,
            followingCount: 0,
            isPrivate: false,
            lastActive: new Date()
          } as UserProfile
        })
      )

      return profiles.filter(Boolean) as UserProfile[]
    } catch (error) {
      console.error('Error getting suggested friends:', error)
      return []
    }
  }

  private async calculateCompatibility(userId1: string, userId2: string): Promise<number> {
    try {
      // Get both users' ratings
      const [user1Ratings, user2Ratings] = await Promise.all([
        prisma.rating.findMany({ where: { userId: userId1 } }),
        prisma.rating.findMany({ where: { userId: userId2 } })
      ])

      // Find common movies
      const user1Movies = new Set(user1Ratings.map(r => r.movieId).filter(Boolean))
      const user2Movies = new Set(user2Ratings.map(r => r.movieId).filter(Boolean))
      
      const commonMovies = Array.from(user1Movies).filter(movieId => user2Movies.has(movieId))
      
      if (commonMovies.length < 3) return 0 // Need at least 3 common movies

      // Calculate rating similarity
      let totalDifference = 0
      commonMovies.forEach(movieId => {
        const rating1 = user1Ratings.find(r => r.movieId === movieId)?.rating || 0
        const rating2 = user2Ratings.find(r => r.movieId === movieId)?.rating || 0
        totalDifference += Math.abs(rating1 - rating2)
      })

      const avgDifference = totalDifference / commonMovies.length
      const compatibility = Math.max(0, 100 - (avgDifference * 20)) // Scale to 0-100%

      return Math.round(compatibility)
    } catch (error) {
      console.error('Error calculating compatibility:', error)
      return 0
    }
  }

  // Content moderation for community safety
  async moderateContent(content: string, userId: string): Promise<{
    approved: boolean
    reasons: string[]
    moderatedContent?: string
  }> {
    const reasons: string[] = []
    let approved = true
    let moderatedContent = content

    // Check content length
    if (content.length > 2000) {
      approved = false
      reasons.push('Content too long (max 2000 characters)')
    }

    // Check for spam patterns
    if (this.isSpammy(content)) {
      approved = false
      reasons.push('Content appears to be spam')
    }

    // Check for spoilers without warnings
    const spoilerLevel = this.detectSpoilerLevel(content)
    if (spoilerLevel === 'major') {
      moderatedContent = `🚨 SPOILER WARNING 🚨\n\n${content}`
      reasons.push('Added spoiler warning')
    }

    // Check user's recent activity for rate limiting
    const recentPosts = await prisma.rating.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    })

    if (recentPosts > 10) {
      approved = false
      reasons.push('Rate limit exceeded (max 10 posts per hour)')
    }

    return {
      approved,
      reasons,
      moderatedContent: approved ? moderatedContent : undefined
    }
  }

  private isSpammy(content: string): boolean {
    // Simple spam detection
    const spamIndicators = [
      /(.)\1{4,}/, // Repeated characters
      /https?:\/\/[^\s]+/gi, // URLs (could be legitimate)
      /(\b\w+\b)(\s+\1){3,}/gi // Repeated words
    ]

    return spamIndicators.some(pattern => pattern.test(content))
  }

  // Weekly digest for social features
  async generateWeeklySocialDigest(userId: string): Promise<{
    friendsActivity: SocialPost[]
    topReviews: SocialPost[]
    suggestedFriends: UserProfile[]
    yourStats: {
      watchedThisWeek: number
      reviewsWritten: number
      likesReceived: number
    }
  }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [friendsActivity, topReviews, suggestedFriends, userStats] = await Promise.all([
      this.getSocialFeed(userId, {
        profanityLevel: 'moderate',
        spoilerProtection: true,
        contentWarnings: true,
        moderatedContent: true
      }),
      this.getTopReviewsOfWeek(),
      this.getSuggestedFriends(userId),
      this.getUserWeeklyStats(userId, oneWeekAgo)
    ])

    return {
      friendsActivity: friendsActivity.slice(0, 5),
      topReviews: topReviews.slice(0, 3),
      suggestedFriends: suggestedFriends.slice(0, 3),
      yourStats: userStats
    }
  }

  private async getTopReviewsOfWeek(): Promise<SocialPost[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // This would be based on likes/engagement in a real system
    const topRatings = await prisma.rating.findMany({
      where: {
        review: { not: null },
        createdAt: { gte: oneWeekAgo }
      },
      include: { user: true, movie: true },
      orderBy: { rating: 'desc' },
      take: 10
    })

    return topRatings.map(rating => this.convertToSocialPost(rating))
  }

  private async getUserWeeklyStats(userId: string, since: Date) {
    const stats = await prisma.rating.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      }
    })

    return {
      watchedThisWeek: stats.length,
      reviewsWritten: stats.filter(s => s.review).length,
      likesReceived: 0 // Would come from likes table
    }
  }
}

export const socialService = new SocialService()
