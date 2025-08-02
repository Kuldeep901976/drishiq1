
import { Database } from '../supabase.types';
import { logger } from './logger';

import { supabase } from './supabase';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  author_id?: string;
  content_type: 'article' | 'video' | 'tutorial' | 'faq';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_reading_time: number;
  slug: string;
  meta_description?: string;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  is_public: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFeedback {
  id: string;
  user_id?: string;
  feedback_type: 'bug_report' | 'feature_request' | 'general_feedback' | 'complaint' | 'compliment';
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_impact: 'low' | 'medium' | 'high' | 'critical';
  browser_info: any;
  device_info: any;
  page_url?: string;
  user_agent?: string;
  screenshot_url?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  assigned_to?: string;
  resolution_notes?: string;
  contact_email?: string;
  allow_follow_up: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  responder_id?: string;
  message: string;
  response_type: 'reply' | 'status_update' | 'resolution' | 'follow_up';
  is_internal: boolean;
  is_public: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  category: string;
  milestone_type: string;
  milestone_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  last_activity_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ProgressStep {
  id: string;
  progress_id: string;
  step_number: number;
  step_name: string;
  step_description?: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  completed_at?: string;
  time_spent_seconds: number;
  step_data: any;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  criteria: any;
  points: number;
  badge_color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward_type: 'none' | 'credits' | 'feature_unlock' | 'badge';
  reward_value: number;
  is_active: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress_percentage: number;
  trigger_event?: string;
  trigger_data: any;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'milestone' | 'feedback_response' | 'system_update' | 'feature_announcement';
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_dismissed: boolean;
  scheduled_at: string;
  expires_at?: string;
  email_sent: boolean;
  push_sent: boolean;
  in_app_shown: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export class MVPService {
  // Help System Methods
  static async getHelpArticles(
    category?: string,
    searchQuery?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    articles: HelpArticle[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('help_articles')
        .select('*')
        .eq('status', 'published')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data: articles, error: articlesError } = await query;

      if (articlesError) {
        logger.error('Error getting help articles', articlesError);
        throw articlesError;
      }

      let countQuery = supabase
        .from('help_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('is_public', true);

      if (category) {
        countQuery = countQuery.eq('category', category);
      }

      if (searchQuery) {
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        logger.error('Error counting help articles', countError);
        throw countError;
      }

      return {
        articles: articles || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get help articles', error);
      throw error;
    }
  }

  static async getHelpArticle(slug: string): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Article not found
        }
        logger.error('Error getting help article', error, { slug });
        throw error;
      }

      // Increment view count
      await supabase
        .from('help_articles')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);

      return data;
    } catch (error) {
      logger.error('Failed to get help article', error, { slug });
      throw error;
    }
  }

  static async trackArticleView(
    articleId: string,
    userId?: string,
    sessionId?: string,
    timeSpent: number = 0,
    scrollPercentage: number = 0,
    searchQuery?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('help_article_views')
        .insert({
          article_id: articleId,
          user_id: userId || null,
          session_id: sessionId || null,
          time_spent_seconds: timeSpent,
          scroll_percentage: scrollPercentage,
          search_query: searchQuery || null,
          viewed_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Error tracking article view', error, { articleId });
        throw error;
      }

      logger.info('Article view tracked', { articleId, userId, timeSpent });
    } catch (error) {
      logger.error('Failed to track article view', error, { articleId });
      throw error;
    }
  }

  static async rateArticleHelpfulness(
    articleId: string,
    isHelpful: boolean,
    feedback?: string,
    userId?: string
  ): Promise<void> {
    try {
      // Update article helpfulness count
      const updateField = isHelpful ? 'helpful_count' : 'not_helpful_count';
      
      const { error: updateError } = await supabase
        .rpc('increment', {
          table_name: 'help_articles',
          row_id: articleId,
          column_name: updateField
        });

      if (updateError) {
        logger.error('Error updating article helpfulness', updateError, { articleId });
        throw updateError;
      }

      // Record the feedback
      const { error: viewError } = await supabase
        .from('help_article_views')
        .insert({
          article_id: articleId,
          user_id: userId,
          helpful: isHelpful
        });

      if (viewError) {
        logger.error('Error recording article feedback', viewError, { articleId });
        throw viewError;
      }

      logger.info('Article rated', { articleId, isHelpful, userId });
    } catch (error) {
      logger.error('Failed to rate article helpfulness', error, { articleId });
      throw error;
    }
  }

  // Feedback System Methods
  static async submitFeedback(
    feedbackData: {
      user_id?: string;
      feedback_type: string;
      title: string;
      description: string;
      category?: string;
      priority?: string;
      user_impact?: string;
      browser_info?: any;
      device_info?: any;
      page_url?: string;
      user_agent?: string;
      screenshot_url?: string;
      contact_email?: string;
      allow_follow_up?: boolean;
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          ...feedbackData,
          priority: feedbackData.priority || 'medium',
          user_impact: feedbackData.user_impact || 'medium',
          allow_follow_up: feedbackData.allow_follow_up !== false,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error submitting feedback', error, { feedbackData });
        throw error;
      }

      // Create notification for admins (you might want to implement admin user detection)
      await this.createNotification(
        data.user_id || '00000000-0000-0000-0000-000000000000', // Fallback to system user
        'New Feedback Submitted',
        `New ${feedbackData.feedback_type} submitted: ${feedbackData.title}`,
        'info',
        `/admin/feedback/${data.id}`,
        'View Feedback'
      );

      logger.info('Feedback submitted', { feedbackId: data.id, type: feedbackData.feedback_type });
      return data.id;
    } catch (error) {
      logger.error('Failed to submit feedback', error, { feedbackData });
      throw error;
    }
  }

  static async getFeedback(
    userId?: string,
    status?: string,
    feedbackType?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    feedback: UserFeedback[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (feedbackType) {
        query = query.eq('feedback_type', feedbackType);
      }

      const { data: feedback, error: feedbackError } = await query;

      if (feedbackError) {
        logger.error('Error getting feedback', feedbackError);
        throw feedbackError;
      }

      let countQuery = supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true });

      if (userId) {
        countQuery = countQuery.eq('user_id', userId);
      }

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      if (feedbackType) {
        countQuery = countQuery.eq('feedback_type', feedbackType);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        logger.error('Error counting feedback', countError);
        throw countError;
      }

      return {
        feedback: feedback || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get feedback', error);
      throw error;
    }
  }

  static async respondToFeedback(
    feedbackId: string,
    responderId: string,
    message: string,
    responseType: 'reply' | 'status_update' | 'resolution' | 'follow_up' = 'reply',
    isInternal: boolean = false
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('feedback_responses')
        .insert({
          feedback_id: feedbackId,
          responder_id: responderId,
          message,
          response_type: responseType,
          is_internal: isInternal,
          is_public: !isInternal
        });

      if (error) {
        logger.error('Error responding to feedback', error, { feedbackId });
        throw error;
      }

      // Get feedback details for notification
      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('user_id, title')
        .eq('id', feedbackId)
        .single();

      if (feedback && feedback.user_id && !isInternal) {
        await this.createNotification(
          feedback.user_id,
          'Feedback Response',
          `You have a new response to your feedback: ${feedback.title}`,
          'feedback_response',
          `/feedback/${feedbackId}`,
          'View Response'
        );
      }

      logger.info('Feedback response added', { feedbackId, responseType });
    } catch (error) {
      logger.error('Failed to respond to feedback', error, { feedbackId });
      throw error;
    }
  }

  // Progress Tracking Methods
  static async updateUserProgress(
    userId: string,
    category: string,
    milestoneType: string,
    milestoneName: string,
    stepNumber?: number,
    completionPercentage?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_user_progress', {
          p_user_id: userId,
          p_category: category,
          p_milestone_type: milestoneType,
          p_milestone_name: milestoneName,
          p_step_number: stepNumber || null,
          p_completion_percentage: completionPercentage || null
        });

      if (error) {
        logger.error('Error updating user progress', error, { userId, category });
        throw error;
      }

      logger.info('User progress updated', { userId, category, milestoneType, milestoneName });
    } catch (error) {
      logger.error('Failed to update user progress', error, { userId });
      throw error;
    }
  }

  static async getUserProgress(
    userId: string,
    category?: string
  ): Promise<UserProgress[]> {
    try {
      let query = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting user progress', error, { userId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get user progress', error, { userId });
      throw error;
    }
  }

  static async getProgressSteps(progressId: string): Promise<ProgressStep[]> {
    try {
      const { data, error } = await supabase
        .from('progress_steps')
        .select('*')
        .eq('progress_id', progressId)
        .order('step_number', { ascending: true });

      if (error) {
        logger.error('Error getting progress steps', error, { progressId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get progress steps', error, { progressId });
      throw error;
    }
  }

  // Achievement System Methods
  static async getAchievements(category?: string): Promise<Achievement[]> {
    try {
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: true })
        .order('points', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting achievements', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get achievements', error);
      throw error;
    }
  }

  static async getUserAchievements(userId: string): Promise<{
    achievements: UserAchievement[];
    totalPoints: number;
  }> {
    try {
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (achievementsError) {
        logger.error('Error getting user achievements', achievementsError, { userId });
        throw achievementsError;
      }

      const totalPoints = userAchievements?.reduce((sum, ua) => {
        const achievement = ua.achievements as any;
        return sum + (achievement?.points || 0);
      }, 0) || 0;

      return {
        achievements: userAchievements || [],
        totalPoints
      };
    } catch (error) {
      logger.error('Failed to get user achievements', error, { userId });
      throw error;
    }
  }

  static async checkUserAchievements(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('check_user_achievements', {
          p_user_id: userId
        });

      if (error) {
        logger.error('Error checking user achievements', error, { userId });
        throw error;
      }

      logger.info('User achievements checked', { userId });
    } catch (error) {
      logger.error('Failed to check user achievements', error, { userId });
      throw error;
    }
  }

  // Notification System Methods
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    actionUrl?: string,
    actionText?: string,
    scheduledAt?: Date,
    expiresAt?: Date,
    metadata: any = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          notification_type: type,
          action_url: actionUrl || null,
          action_text: actionText || null,
          scheduled_at: scheduledAt?.toISOString() || new Date().toISOString(),
          expires_at: expiresAt?.toISOString() || null,
          metadata
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating notification', error, { userId });
        throw error;
      }

      logger.info('Notification created', { userId, type, notificationId: data.id });
      return data.id;
    } catch (error) {
      logger.error('Failed to create notification', error, { userId });
      throw error;
    }
  }

  static async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .lte('scheduled_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error: notificationsError } = await query;

      if (notificationsError) {
        logger.error('Error getting user notifications', notificationsError, { userId });
        throw notificationsError;
      }

      // Get total count
      let countQuery = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .lte('scheduled_at', new Date().toISOString());

      if (unreadOnly) {
        countQuery = countQuery.eq('is_read', false);
      }

      const { count: total, error: countError } = await countQuery;

      if (countError) {
        logger.error('Error counting notifications', countError, { userId });
        throw countError;
      }

      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .lte('scheduled_at', new Date().toISOString());

      if (unreadError) {
        logger.error('Error counting unread notifications', unreadError, { userId });
        throw unreadError;
      }

      return {
        notifications: notifications || [],
        total: total || 0,
        unreadCount: unreadCount || 0
      };
    } catch (error) {
      logger.error('Failed to get user notifications', error, { userId });
      throw error;
    }
  }

  static async markNotificationRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error marking notification read', error, { notificationId });
        throw error;
      }

      logger.info('Notification marked as read', { notificationId, userId });
    } catch (error) {
      logger.error('Failed to mark notification read', error, { notificationId });
      throw error;
    }
  }

  static async dismissNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_dismissed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error dismissing notification', error, { notificationId });
        throw error;
      }

      logger.info('Notification dismissed', { notificationId, userId });
    } catch (error) {
      logger.error('Failed to dismiss notification', error, { notificationId });
      throw error;
    }
  }

  // Feature Usage Tracking
  static async trackFeatureUsage(
    userId: string,
    featureName: string,
    action: string,
    featureCategory?: string,
    success: boolean = true,
    responseTimeMs?: number,
    usageData: any = {}
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('track_feature_usage', {
          p_user_id: userId,
          p_feature_name: featureName,
          p_action: action,
          p_feature_category: featureCategory || null,
          p_success: success,
          p_response_time_ms: responseTimeMs || null,
          p_usage_data: usageData
        });

      if (error) {
        logger.error('Error tracking feature usage', error, { userId, featureName });
        throw error;
      }

      logger.info('Feature usage tracked', { userId, featureName, action });
    } catch (error) {
      logger.error('Failed to track feature usage', error, { userId, featureName });
      throw error;
    }
  }

  // Analytics and Insights
  static async getUserEngagementSummary(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_engagement_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Error getting user engagement summary', error, { userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get user engagement summary', error, { userId });
      throw error;
    }
  }

  static async getHelpContentAnalytics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('help_content_analytics')
        .select('*')
        .order('view_count', { ascending: false });

      if (error) {
        logger.error('Error getting help content analytics', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get help content analytics', error);
      throw error;
    }
  }

  static async getFeedbackAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('feedback_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.limit(30);

      if (error) {
        logger.error('Error getting feedback analytics', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get feedback analytics', error);
      throw error;
    }
  }
} 