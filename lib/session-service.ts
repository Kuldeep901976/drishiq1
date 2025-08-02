
import { Database } from '../supabase.types';
import { logger } from './logger';

import { supabase } from './supabase';

export interface SessionType {
  id: string;
  name: string;
  description?: string;
  credit_cost: number;
  duration_minutes: number;
  max_duration_minutes: number;
  features: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_type_id: string;
  title?: string;
  description?: string;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled' | 'expired';
  credits_deducted: number;
  credits_per_minute: number;
  billing_mode: 'prepaid' | 'postpaid' | 'free';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes: number;
  session_data: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface SessionActivity {
  id: string;
  session_id: string;
  activity_type: string;
  activity_data: any;
  credits_used: number;
  timestamp: string;
  created_at: string;
}

export interface SessionCreditTransaction {
  id: string;
  user_id: string;
  session_id: string;
  transaction_type: 'deduction' | 'refund' | 'bonus';
  amount: number;
  description?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface SessionUsageStats {
  id: string;
  user_id: string;
  date: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  total_minutes: number;
  active_minutes: number;
  credits_used: number;
  credits_refunded: number;
  avg_session_duration: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface SessionReminder {
  id: string;
  session_id: string;
  reminder_type: 'pre_session' | 'low_credits' | 'session_end' | 'follow_up';
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  reminder_data: any;
  created_at: string;
}

export class SessionService {
  // Get all active session types
  static async getSessionTypes(): Promise<SessionType[]> {
    try {
      const { data, error } = await supabase
        .from('session_types')
        .select('*')
        .eq('is_active', true)
        .order('credit_cost', { ascending: true });

      if (error) {
        logger.error('Error getting session types', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get session types', error);
      throw error;
    }
  }

  // Start a new session
  static async startSession(
    userId: string,
    sessionTypeId: string,
    title?: string,
    description?: string,
    scheduledAt?: Date
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('start_session', {
          p_user_id: userId,
          p_session_type_id: sessionTypeId,
          p_title: title || null,
          p_description: description || null,
          p_scheduled_at: scheduledAt?.toISOString() || new Date().toISOString()
        });

      if (error) {
        logger.error('Error starting session', error, { userId, sessionTypeId });
        throw error;
      }

      logger.info('Session started', { userId, sessionTypeId, sessionId: data });
      return data;
    } catch (error) {
      logger.error('Failed to start session', error, { userId, sessionTypeId });
      throw error;
    }
  }

  // End a session
  static async endSession(
    sessionId: string,
    reason: string = 'completed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('end_session', {
          p_session_id: sessionId,
          p_reason: reason
        });

      if (error) {
        logger.error('Error ending session', error, { sessionId, reason });
        throw error;
      }

      logger.info('Session ended', { sessionId, reason });
    } catch (error) {
      logger.error('Failed to end session', error, { sessionId, reason });
      throw error;
    }
  }

  // Extend session duration
  static async extendSession(
    sessionId: string,
    additionalMinutes: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('extend_session', {
          p_session_id: sessionId,
          p_additional_minutes: additionalMinutes
        });

      if (error) {
        logger.error('Error extending session', error, { sessionId, additionalMinutes });
        throw error;
      }

      logger.info('Session extended', { sessionId, additionalMinutes });
    } catch (error) {
      logger.error('Failed to extend session', error, { sessionId, additionalMinutes });
      throw error;
    }
  }

  // Pause session
  static async pauseSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          status: 'paused',
          metadata: { paused_at: new Date().toISOString() }
        })
        .eq('id', sessionId)
        .eq('status', 'active');

      if (error) {
        logger.error('Error pausing session', error, { sessionId });
        throw error;
      }

      // Log pause activity
      await this.logSessionActivity(sessionId, 'pause', { timestamp: new Date().toISOString() });

      logger.info('Session paused', { sessionId });
    } catch (error) {
      logger.error('Failed to pause session', error, { sessionId });
      throw error;
    }
  }

  // Resume session
  static async resumeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          status: 'active',
          metadata: { resumed_at: new Date().toISOString() }
        })
        .eq('id', sessionId)
        .eq('status', 'paused');

      if (error) {
        logger.error('Error resuming session', error, { sessionId });
        throw error;
      }

      // Log resume activity
      await this.logSessionActivity(sessionId, 'resume', { timestamp: new Date().toISOString() });

      logger.info('Session resumed', { sessionId });
    } catch (error) {
      logger.error('Failed to resume session', error, { sessionId });
      throw error;
    }
  }

  // Log session activity
  static async logSessionActivity(
    sessionId: string,
    activityType: string,
    activityData: any = {},
    creditsUsed: number = 0
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_activities')
        .insert({
          session_id: sessionId,
          activity_type: activityType,
          activity_data: activityData,
          credits_used: creditsUsed,
          timestamp: new Date().toISOString()
        });

      if (error) {
        logger.error('Error logging session activity', error, { sessionId, activityType });
        throw error;
      }

      logger.info('Session activity logged', { sessionId, activityType });
    } catch (error) {
      logger.error('Failed to log session activity', error, { sessionId, activityType });
      throw error;
    }
  }

  // Get user sessions
  static async getUserSessions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    sessions: UserSession[];
    total: number;
  }> {
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          session_types (
            name,
            description,
            credit_cost,
            duration_minutes,
            features
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (sessionsError) {
        logger.error('Error getting user sessions', sessionsError, { userId });
        throw sessionsError;
      }

      const { count, error: countError } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logger.error('Error counting user sessions', countError, { userId });
        throw countError;
      }

      return {
        sessions: sessions || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get user sessions', error, { userId });
      throw error;
    }
  }

  // Get session details
  static async getSessionDetails(sessionId: string): Promise<{
    session: UserSession;
    activities: SessionActivity[];
    transactions: SessionCreditTransaction[];
  }> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          session_types (
            name,
            description,
            credit_cost,
            duration_minutes,
            max_duration_minutes,
            features
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        logger.error('Error getting session details', sessionError, { sessionId });
        throw sessionError;
      }

      const { data: activities, error: activitiesError } = await supabase
        .from('session_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        logger.error('Error getting session activities', activitiesError, { sessionId });
        throw activitiesError;
      }

      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        logger.error('Error getting session transactions', transactionsError, { sessionId });
        throw transactionsError;
      }

      return {
        session,
        activities: activities || [],
        transactions: transactions || []
      };
    } catch (error) {
      logger.error('Failed to get session details', error, { sessionId });
      throw error;
    }
  }

  // Get user session statistics
  static async getUserSessionStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalMinutes: number;
    totalCreditsUsed: number;
    avgSessionDuration: number;
    completionRate: number;
    recentStats: SessionUsageStats[];
  }> {
    try {
      const { data: stats, error: statsError } = await supabase
        .from('session_usage_stats')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

      if (statsError) {
        logger.error('Error getting user session stats', statsError, { userId });
        throw statsError;
      }

      // Calculate aggregated statistics
      const totalSessions = stats?.reduce((sum, stat) => sum + stat.total_sessions, 0) || 0;
      const completedSessions = stats?.reduce((sum, stat) => sum + stat.completed_sessions, 0) || 0;
      const cancelledSessions = stats?.reduce((sum, stat) => sum + stat.cancelled_sessions, 0) || 0;
      const totalMinutes = stats?.reduce((sum, stat) => sum + stat.total_minutes, 0) || 0;
      const totalCreditsUsed = stats?.reduce((sum, stat) => sum + stat.credits_used, 0) || 0;
      const avgSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      return {
        totalSessions,
        completedSessions,
        cancelledSessions,
        totalMinutes,
        totalCreditsUsed,
        avgSessionDuration,
        completionRate,
        recentStats: stats || []
      };
    } catch (error) {
      logger.error('Failed to get user session stats', error, { userId });
      throw error;
    }
  }

  // Check if user has sufficient credits
  static async checkUserCredits(userId: string, requiredCredits: number): Promise<{
    hasCredits: boolean;
    currentCredits: number;
    shortfall: number;
  }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error checking user credits', error, { userId });
        throw error;
      }

      const currentCredits = user?.credits || 0;
      const hasCredits = currentCredits >= requiredCredits;
      const shortfall = hasCredits ? 0 : requiredCredits - currentCredits;

      return {
        hasCredits,
        currentCredits,
        shortfall
      };
    } catch (error) {
      logger.error('Failed to check user credits', error, { userId });
      throw error;
    }
  }

  // Get active sessions
  static async getActiveSessions(userId?: string): Promise<UserSession[]> {
    try {
      let query = supabase
        .from('user_sessions')
        .select(`
          *,
          session_types (
            name,
            description,
            credit_cost,
            duration_minutes,
            features
          ),
          users (
            email,
            full_name
          )
        `)
        .in('status', ['active', 'paused'])
        .order('started_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting active sessions', error, { userId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get active sessions', error, { userId });
      throw error;
    }
  }

  // Schedule session reminder
  static async scheduleReminder(
    sessionId: string,
    reminderType: 'pre_session' | 'low_credits' | 'session_end' | 'follow_up',
    scheduledAt: Date,
    reminderData: any = {}
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_reminders')
        .insert({
          session_id: sessionId,
          reminder_type: reminderType,
          scheduled_at: scheduledAt.toISOString(),
          reminder_data: reminderData,
          status: 'pending'
        });

      if (error) {
        logger.error('Error scheduling reminder', error, { sessionId, reminderType });
        throw error;
      }

      logger.info('Session reminder scheduled', { sessionId, reminderType, scheduledAt });
    } catch (error) {
      logger.error('Failed to schedule reminder', error, { sessionId, reminderType });
      throw error;
    }
  }

  // Process expired sessions
  static async processExpiredSessions(): Promise<void> {
    try {
      const { data: expiredSessions, error } = await supabase
        .from('user_sessions')
        .select('id, user_id, started_at, duration_minutes, credits_per_minute')
        .eq('status', 'active')
        .lt('started_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // 4 hours ago

      if (error) {
        logger.error('Error getting expired sessions', error);
        throw error;
      }

      for (const session of expiredSessions || []) {
        try {
          await this.endSession(session.id, 'expired');
          logger.info('Expired session ended', { sessionId: session.id });
        } catch (error) {
          logger.error('Error ending expired session', error, { sessionId: session.id });
        }
      }
    } catch (error) {
      logger.error('Failed to process expired sessions', error);
      throw error;
    }
  }

  // Process pending reminders
  static async processPendingReminders(): Promise<void> {
    try {
      const { data: reminders, error } = await supabase
        .from('session_reminders')
        .select(`
          *,
          user_sessions (
            id,
            user_id,
            title,
            scheduled_at,
            users (
              email,
              full_name
            )
          )
        `)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString());

      if (error) {
        logger.error('Error getting pending reminders', error);
        throw error;
      }

      for (const reminder of reminders || []) {
        try {
          // Here you would integrate with your notification system
          // For now, we'll just mark as sent
          await supabase
            .from('session_reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          logger.info('Reminder sent', { reminderId: reminder.id, type: reminder.reminder_type });
        } catch (error) {
          logger.error('Error sending reminder', error, { reminderId: reminder.id });
        }
      }
    } catch (error) {
      logger.error('Failed to process pending reminders', error);
      throw error;
    }
  }

  // Get session analytics
  static async getSessionAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    totalCreditsUsed: number;
    activeUsers: number;
    avgSessionDuration: number;
    dailyStats: any[];
  }> {
    try {
      let query = supabase
        .from('daily_session_stats')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data: dailyStats, error } = await query.limit(30);

      if (error) {
        logger.error('Error getting session analytics', error);
        throw error;
      }

      // Calculate aggregated statistics
      const totalSessions = dailyStats?.reduce((sum, stat) => sum + stat.total_sessions, 0) || 0;
      const completedSessions = dailyStats?.reduce((sum, stat) => sum + stat.completed_sessions, 0) || 0;
      const totalMinutes = dailyStats?.reduce((sum, stat) => sum + stat.total_minutes, 0) || 0;
      const totalCreditsUsed = dailyStats?.reduce((sum, stat) => sum + stat.total_credits_used, 0) || 0;
      const activeUsers = Math.max(...(dailyStats?.map(stat => stat.active_users) || [0]));
      const avgSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;

      return {
        totalSessions,
        completedSessions,
        totalMinutes,
        totalCreditsUsed,
        activeUsers,
        avgSessionDuration,
        dailyStats: dailyStats || []
      };
    } catch (error) {
      logger.error('Failed to get session analytics', error);
      throw error;
    }
  }

  // Get credit transactions for a user (and optionally a session)
  static async getCreditTransactions(userId: string, sessionId?: string): Promise<SessionCreditTransaction[]> {
    try {
      let query = supabase
        .from('session_credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching credit transactions', error, { userId, sessionId });
        throw error;
      }
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch credit transactions', error, { userId, sessionId });
      throw error;
    }
  }
}

// Create and export the service instance
export const sessionService = {
  getSessionTypes: SessionService.getSessionTypes,
  startSession: SessionService.startSession,
  endSession: SessionService.endSession,
  extendSession: SessionService.extendSession,
  pauseSession: SessionService.pauseSession,
  resumeSession: SessionService.resumeSession,
  logSessionActivity: SessionService.logSessionActivity,
  getUserSessions: SessionService.getUserSessions,
  getSessionDetails: SessionService.getSessionDetails,
  getUserSessionStats: SessionService.getUserSessionStats,
  checkUserCredits: SessionService.checkUserCredits,
  getActiveSessions: SessionService.getActiveSessions,
  scheduleReminder: SessionService.scheduleReminder,
  processExpiredSessions: SessionService.processExpiredSessions,
  processPendingReminders: SessionService.processPendingReminders,
  getSessionAnalytics: SessionService.getSessionAnalytics,
  getCreditTransactions: SessionService.getCreditTransactions
}; 