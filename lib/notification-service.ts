// lib/notification-service.ts - FIXED IMPORTS

import { PrismaClient } from '@prisma/client'
import { hybridAIEngine } from './hybrid-ai-recommendation-engine' // FIXED: Use existing AI engine

const prisma = new PrismaClient()

interface UserActivity {
  userId: string
  lastActiveTime: Date
  preferredWatchingHours: number[]
  avgSessionLength: number
}

export class SmartNotificationService {
  
  // Analyze user's optimal watching times
  async analyzeOptimalTiming(userId: string): Promise<UserActivity> {
    const interactions = await prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const ratings = await prisma.rating.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Analyze patterns
    const hourCounts: Record<number, number> = {}
    
    const allActivities = [...interactions, ...ratings]
    allActivities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    // Find top 3 most active hours
    const preferredHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    return {
      userId,
      lastActiveTime: new Date(),
      preferredWatchingHours: preferredHours,
      avgSessionLength: 90
    }
  }

  // Send notification at optimal time
  async sendOptimalTimingNotification(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      })

      if (!user) return

      const currentHour = new Date().getHours()
      const timeContext = this.getTimeContext(currentHour)
      
      // FIXED: Use the existing hybrid AI engine
      const userProfile = user.preferences ? {
        preferredGenres: user.preferences.genreWeights as any,
        personalityType: user.preferences.personalityType,
        moodPreferences: user.preferences.moodProfile as any,
        complexityLevel: user.preferences.complexityLevel
      } : null

      if (userProfile) {
        const recommendations = await hybridAIEngine.generateEnhancedRecommendations(userProfile)
        
        if (recommendations.length > 0) {
          await this.sendNotification(user, {
            type: 'optimal_timing',
            title: `Perfect time to watch something! 🎬`,
            message: `Based on your patterns, now is perfect for ${timeContext}`,
            movieId: recommendations[0].id,
            reasoning: `AI picked ${recommendations[0].title} for your current mood`
          })
        }
      }
    } catch (error) {
      console.error('Error sending optimal timing notification:', error)
    }
  }

  private getTimeContext(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning energetic content'
    if (hour >= 12 && hour < 17) return 'afternoon relaxation'
    if (hour >= 17 && hour < 21) return 'evening entertainment'
    return 'night atmospheric films'
  }

  // Universal notification sender
  private async sendNotification(user: any, notification: {
    type: string
    title: string
    message: string
    movieId?: string | number
    reasoning?: string
  }) {
    try {
      console.log(`📱 Notification for ${user.email}:`, notification)
      
      // Save to database
      await prisma.userInteraction.create({
        data: {
          userId: user.id,
          action: 'notification_sent',
          target: notification.type,
          context: {
            title: notification.title,
            message: notification.message,
            timing: new Date().toISOString()
          }
        }
      })

      // TODO: Integrate with mobile push services
      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  // Initialize scheduler
  initializeSmartScheduler() {
    console.log('🔔 Smart notification scheduler initialized')
    
    // Check every 30 minutes for optimal timing
    setInterval(() => {
      this.checkOptimalTimingForAllUsers()
    }, 30 * 60 * 1000)
  }

  private async checkOptimalTimingForAllUsers() {
    try {
      const activeUsers = await prisma.user.findMany({
        where: {
          interactions: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        take: 50
      })

      for (const user of activeUsers) {
        await this.sendOptimalTimingNotification(user.id)
      }
    } catch (error) {
      console.error('Error checking optimal timing:', error)
    }
  }
}

export const smartNotificationService = new SmartNotificationService()