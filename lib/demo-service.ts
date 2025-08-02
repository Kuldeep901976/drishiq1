
import { Database } from '../supabase.types';
import { logger } from './logger';

import { supabase } from './supabase';

export interface DemoCategory {
  id: string;
  name: string;
  description?: string;
  features: any;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoInvitation {
  id: string;
  invitation_id: string;
  demo_category_id?: string;
  stakeholder_type: 'investor' | 'partner' | 'customer' | 'media' | 'analyst' | 'advisor' | 'board_member' | 'other';
  company_name?: string;
  title?: string;
  purpose?: string;
  demo_features: any;
  custom_branding: any;
  session_duration_minutes: number;
  max_participants: number;
  preferred_time_slots: any[];
  scheduled_at?: string;
  demo_url?: string;
  meeting_id?: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  confirmation_sent_at?: string;
  reminder_sent_at?: string;
  admin_notes?: string;
  demo_notes?: string;
  feedback_collected: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface DemoSession {
  id: string;
  demo_invitation_id: string;
  session_id?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes: number;
  host_user_id?: string;
  participants: any[];
  actual_participants: number;
  features_demonstrated: any[];
  questions_asked: any[];
  issues_encountered: any[];
  engagement_score?: number;
  satisfaction_score?: number;
  likelihood_to_recommend?: number;
  follow_up_required: boolean;
  next_steps?: string;
  status: 'active' | 'completed' | 'cancelled' | 'interrupted';
  created_at: string;
  updated_at: string;
}

export interface DemoFeedback {
  id: string;
  demo_session_id: string;
  demo_invitation_id: string;
  overall_rating?: number;
  ease_of_use?: number;
  feature_relevance?: number;
  presentation_quality?: number;
  what_liked?: string;
  what_disliked?: string;
  suggestions?: string;
  additional_comments?: string;
  interest_level?: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  timeline_to_decide?: string;
  budget_range?: string;
  decision_makers?: string;
  preferred_contact_method?: string;
  follow_up_frequency?: string;
  created_at: string;
}

export interface DemoTemplate {
  id: string;
  name: string;
  description?: string;
  demo_category_id?: string;
  template_config: any;
  script_outline: any;
  key_features: any[];
  demo_flow: any[];
  branding_config: any;
  custom_css?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoAnalytics {
  id: string;
  date: string;
  demo_category_id?: string;
  invitations_sent: number;
  demos_scheduled: number;
  demos_completed: number;
  demos_cancelled: number;
  no_shows: number;
  avg_duration_minutes: number;
  avg_engagement_score: number;
  avg_satisfaction_score: number;
  avg_likelihood_to_recommend: number;
  follow_ups_requested: number;
  leads_generated: number;
  trials_started: number;
  stakeholder_breakdown: any;
  created_at: string;
  updated_at: string;
}

export class DemoService {
  // Get all active demo categories
  static async getDemoCategories(): Promise<DemoCategory[]> {
    try {
      const { data, error } = await supabase
        .from('demo_categories')
        .select('*')
        .eq('is_active', true)
        .order('duration_minutes', { ascending: true });

      if (error) {
        logger.error('Error getting demo categories', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get demo categories', error);
      throw error;
    }
  }

  // Create demo invitation
  static async createDemoInvitation(
    email: string,
    stakeholderType: string,
    companyName?: string,
    title?: string,
    purpose?: string,
    demoCategoryId?: string,
    sessionDuration: number = 30,
    maxParticipants: number = 1
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_demo_invitation', {
          p_email: email,
          p_stakeholder_type: stakeholderType,
          p_company_name: companyName || null,
          p_title: title || null,
          p_purpose: purpose || null,
          p_demo_category_id: demoCategoryId || null,
          p_session_duration: sessionDuration,
          p_max_participants: maxParticipants
        });

      if (error) {
        logger.error('Error creating demo invitation', error, { email, stakeholderType });
        throw error;
      }

      logger.info('Demo invitation created', { email, stakeholderType, demoInvitationId: data });
      return data;
    } catch (error) {
      logger.error('Failed to create demo invitation', error, { email, stakeholderType });
      throw error;
    }
  }

  // Schedule demo
  static async scheduleDemo(
    demoInvitationId: string,
    scheduledAt: Date,
    meetingId?: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('schedule_demo', {
          p_demo_invitation_id: demoInvitationId,
          p_scheduled_at: scheduledAt.toISOString(),
          p_meeting_id: meetingId || null,
          p_admin_notes: adminNotes || null
        });

      if (error) {
        logger.error('Error scheduling demo', error, { demoInvitationId });
        throw error;
      }

      logger.info('Demo scheduled', { demoInvitationId, scheduledAt });
    } catch (error) {
      logger.error('Failed to schedule demo', error, { demoInvitationId });
      throw error;
    }
  }

  // Start demo session
  static async startDemoSession(
    demoInvitationId: string,
    hostUserId: string,
    participants: any[] = []
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('demo_sessions')
        .insert({
          demo_invitation_id: demoInvitationId,
          started_at: new Date().toISOString(),
          host_user_id: hostUserId,
          participants: participants,
          actual_participants: participants.length,
          features_demonstrated: [],
          questions_asked: [],
          issues_encountered: [],
          follow_up_required: false,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error starting demo session', error, { demoInvitationId });
        throw error;
      }

      // Update demo invitation status
      await supabase
        .from('demo_invitations')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', demoInvitationId);

      logger.info('Demo session started', { demoInvitationId, sessionId: data.id });
      return data.id;
    } catch (error) {
      logger.error('Failed to start demo session', error, { demoInvitationId });
      throw error;
    }
  }

  // Complete demo session
  static async completeDemoSession(
    demoSessionId: string,
    engagementScore?: number,
    satisfactionScore?: number,
    likelihoodToRecommend?: number,
    followUpRequired: boolean = false,
    nextSteps?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('complete_demo_session', {
          p_demo_session_id: demoSessionId,
          p_engagement_score: engagementScore || null,
          p_satisfaction_score: satisfactionScore || null,
          p_likelihood_to_recommend: likelihoodToRecommend || null,
          p_follow_up_required: followUpRequired,
          p_next_steps: nextSteps || null
        });

      if (error) {
        logger.error('Error completing demo session', error, { demoSessionId });
        throw error;
      }

      logger.info('Demo session completed', { demoSessionId });
    } catch (error) {
      logger.error('Failed to complete demo session', error, { demoSessionId });
      throw error;
    }
  }

  // Log demo feature demonstration
  static async logFeatureDemonstration(
    demoSessionId: string,
    feature: string,
    duration: number,
    userInteraction: boolean = false
  ): Promise<void> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .select('features_demonstrated')
        .eq('id', demoSessionId)
        .single();

      if (sessionError) {
        logger.error('Error getting demo session', sessionError, { demoSessionId });
        throw sessionError;
      }

      const featuresDemo = session?.features_demonstrated || [];
      featuresDemo.push({
        feature,
        duration,
        user_interaction: userInteraction,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('demo_sessions')
        .update({
          features_demonstrated: featuresDemo,
          updated_at: new Date().toISOString()
        })
        .eq('id', demoSessionId);

      if (error) {
        logger.error('Error logging feature demonstration', error, { demoSessionId, feature });
        throw error;
      }

      logger.info('Feature demonstration logged', { demoSessionId, feature, duration });
    } catch (error) {
      logger.error('Failed to log feature demonstration', error, { demoSessionId, feature });
      throw error;
    }
  }

  // Log demo question
  static async logDemoQuestion(
    demoSessionId: string,
    question: string,
    answer?: string,
    followUpRequired: boolean = false
  ): Promise<void> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .select('questions_asked')
        .eq('id', demoSessionId)
        .single();

      if (sessionError) {
        logger.error('Error getting demo session', sessionError, { demoSessionId });
        throw sessionError;
      }

      const questionsAsked = session?.questions_asked || [];
      questionsAsked.push({
        question,
        answer,
        follow_up_required: followUpRequired,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('demo_sessions')
        .update({
          questions_asked: questionsAsked,
          updated_at: new Date().toISOString()
        })
        .eq('id', demoSessionId);

      if (error) {
        logger.error('Error logging demo question', error, { demoSessionId, question });
        throw error;
      }

      logger.info('Demo question logged', { demoSessionId, question });
    } catch (error) {
      logger.error('Failed to log demo question', error, { demoSessionId, question });
      throw error;
    }
  }

  // Submit demo feedback
  static async submitDemoFeedback(
    demoSessionId: string,
    demoInvitationId: string,
    feedback: {
      overall_rating?: number;
      ease_of_use?: number;
      feature_relevance?: number;
      presentation_quality?: number;
      what_liked?: string;
      what_disliked?: string;
      suggestions?: string;
      additional_comments?: string;
      interest_level?: string;
      timeline_to_decide?: string;
      budget_range?: string;
      decision_makers?: string;
      preferred_contact_method?: string;
      follow_up_frequency?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('demo_feedback')
        .insert({
          demo_session_id: demoSessionId,
          demo_invitation_id: demoInvitationId,
          ...feedback
        });

      if (error) {
        logger.error('Error submitting demo feedback', error, { demoSessionId });
        throw error;
      }

      // Mark feedback as collected
      await supabase
        .from('demo_invitations')
        .update({
          feedback_collected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', demoInvitationId);

      logger.info('Demo feedback submitted', { demoSessionId, demoInvitationId });
    } catch (error) {
      logger.error('Failed to submit demo feedback', error, { demoSessionId });
      throw error;
    }
  }

  // Get demo invitation details
  static async getDemoInvitation(invitationId: string): Promise<{
    invitation: DemoInvitation;
    category?: DemoCategory;
    sessions: DemoSession[];
    feedback: DemoFeedback[];
  }> {
    try {
      const { data: invitation, error: invitationError } = await supabase
        .from('demo_invitations')
        .select(`
          *,
          demo_categories (*),
          invitations (*)
        `)
        .eq('id', invitationId)
        .single();

      if (invitationError) {
        logger.error('Error getting demo invitation', invitationError, { invitationId });
        throw invitationError;
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from('demo_sessions')
        .select('*')
        .eq('demo_invitation_id', invitationId)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        logger.error('Error getting demo sessions', sessionsError, { invitationId });
        throw sessionsError;
      }

      const { data: feedback, error: feedbackError } = await supabase
        .from('demo_feedback')
        .select('*')
        .eq('demo_invitation_id', invitationId)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        logger.error('Error getting demo feedback', feedbackError, { invitationId });
        throw feedbackError;
      }

      return {
        invitation,
        category: invitation.demo_categories,
        sessions: sessions || [],
        feedback: feedback || []
      };
    } catch (error) {
      logger.error('Failed to get demo invitation', error, { invitationId });
      throw error;
    }
  }

  // Get demo invitations list
  static async getDemoInvitations(
    limit: number = 50,
    offset: number = 0,
    status?: string,
    stakeholderType?: string
  ): Promise<{
    invitations: DemoInvitation[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('demo_invitations')
        .select(`
          *,
          demo_categories (name, description),
          invitations (email, created_at)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (stakeholderType) {
        query = query.eq('stakeholder_type', stakeholderType);
      }

      const { data: invitations, error: invitationsError } = await query;

      if (invitationsError) {
        logger.error('Error getting demo invitations', invitationsError);
        throw invitationsError;
      }

      let countQuery = supabase
        .from('demo_invitations')
        .select('*', { count: 'exact', head: true });

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      if (stakeholderType) {
        countQuery = countQuery.eq('stakeholder_type', stakeholderType);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        logger.error('Error counting demo invitations', countError);
        throw countError;
      }

      return {
        invitations: invitations || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get demo invitations', error);
      throw error;
    }
  }

  // Get demo templates
  static async getDemoTemplates(categoryId?: string): Promise<DemoTemplate[]> {
    try {
      let query = supabase
        .from('demo_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (categoryId) {
        query = query.eq('demo_category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting demo templates', error, { categoryId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get demo templates', error, { categoryId });
      throw error;
    }
  }

  // Get demo analytics
  static async getDemoAnalytics(
    startDate?: Date,
    endDate?: Date,
    categoryId?: string
  ): Promise<{
    totalInvitations: number;
    scheduledDemos: number;
    completedDemos: number;
    conversionRate: number;
    avgDuration: number;
    avgEngagement: number;
    avgSatisfaction: number;
    avgNPS: number;
    followUpsRequired: number;
    dailyStats: DemoAnalytics[];
    stakeholderBreakdown: any;
  }> {
    try {
      let query = supabase
        .from('demo_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      if (categoryId) {
        query = query.eq('demo_category_id', categoryId);
      }

      const { data: dailyStats, error } = await query.limit(30);

      if (error) {
        logger.error('Error getting demo analytics', error);
        throw error;
      }

      // Calculate aggregated statistics
      const totalInvitations = dailyStats?.reduce((sum, stat) => sum + stat.invitations_sent, 0) || 0;
      const scheduledDemos = dailyStats?.reduce((sum, stat) => sum + stat.demos_scheduled, 0) || 0;
      const completedDemos = dailyStats?.reduce((sum, stat) => sum + stat.demos_completed, 0) || 0;
      const conversionRate = totalInvitations > 0 ? (completedDemos / totalInvitations) * 100 : 0;
      const avgDuration = dailyStats?.reduce((sum, stat) => sum + stat.avg_duration_minutes, 0) / (dailyStats?.length || 1) || 0;
      const avgEngagement = dailyStats?.reduce((sum, stat) => sum + stat.avg_engagement_score, 0) / (dailyStats?.length || 1) || 0;
      const avgSatisfaction = dailyStats?.reduce((sum, stat) => sum + stat.avg_satisfaction_score, 0) / (dailyStats?.length || 1) || 0;
      const avgNPS = dailyStats?.reduce((sum, stat) => sum + stat.avg_likelihood_to_recommend, 0) / (dailyStats?.length || 1) || 0;
      const followUpsRequired = dailyStats?.reduce((sum, stat) => sum + stat.follow_ups_requested, 0) || 0;

      // Aggregate stakeholder breakdown
      const stakeholderBreakdown = dailyStats?.reduce((acc, stat) => {
        const breakdown = stat.stakeholder_breakdown || {};
        Object.keys(breakdown).forEach(key => {
          acc[key] = (acc[key] || 0) + breakdown[key];
        });
        return acc;
      }, {} as any) || {};

      return {
        totalInvitations,
        scheduledDemos,
        completedDemos,
        conversionRate,
        avgDuration,
        avgEngagement,
        avgSatisfaction,
        avgNPS,
        followUpsRequired,
        dailyStats: dailyStats || [],
        stakeholderBreakdown
      };
    } catch (error) {
      logger.error('Failed to get demo analytics', error);
      throw error;
    }
  }

  // Get demo conversion funnel
  static async getDemoConversionFunnel(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('demo_conversion_funnel')
        .select('*')
        .order('completion_rate', { ascending: false });

      if (error) {
        logger.error('Error getting demo conversion funnel', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get demo conversion funnel', error);
      throw error;
    }
  }

  // Get demo performance metrics
  static async getDemoPerformanceMetrics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('demo_performance_metrics')
        .select('*')
        .order('avg_satisfaction', { ascending: false });

      if (error) {
        logger.error('Error getting demo performance metrics', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get demo performance metrics', error);
      throw error;
    }
  }

  // Cancel demo
  static async cancelDemo(
    demoInvitationId: string,
    reason: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('demo_invitations')
        .update({
          status: 'cancelled',
          admin_notes: adminNotes || reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', demoInvitationId);

      if (error) {
        logger.error('Error cancelling demo', error, { demoInvitationId });
        throw error;
      }

      // Update analytics
      const { data: invitation } = await supabase
        .from('demo_invitations')
        .select('demo_category_id')
        .eq('id', demoInvitationId)
        .single();

      if (invitation) {
        await supabase
          .from('demo_analytics')
          .upsert([
            {
              date: new Date().toISOString().split('T')[0],
              demo_category_id: invitation.demo_category_id,
              demos_cancelled: 1
            }
          ], { onConflict: 'date,demo_category_id' });
      }

      logger.info('Demo cancelled', { demoInvitationId, reason });
    } catch (error) {
      logger.error('Failed to cancel demo', error, { demoInvitationId });
      throw error;
    }
  }

  // Mark demo as no-show
  static async markDemoNoShow(demoInvitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('demo_invitations')
        .update({
          status: 'no_show',
          updated_at: new Date().toISOString()
        })
        .eq('id', demoInvitationId);

      if (error) {
        logger.error('Error marking demo as no-show', error, { demoInvitationId });
        throw error;
      }

      logger.info('Demo marked as no-show', { demoInvitationId });
    } catch (error) {
      logger.error('Failed to mark demo as no-show', error, { demoInvitationId });
      throw error;
    }
  }

  // Process demo reminders
  static async processDemoReminders(): Promise<void> {
    try {
      const { data: upcomingDemos, error } = await supabase
        .from('demo_invitations')
        .select(`
          *,
          invitations (email)
        `)
        .eq('status', 'scheduled')
        .is('reminder_sent_at', null)
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()); // Next 24 hours

      if (error) {
        logger.error('Error getting upcoming demos for reminders', error);
        throw error;
      }

      for (const demo of upcomingDemos || []) {
        try {
          // Here you would integrate with your notification system
          // For now, we'll just mark as sent
          await supabase
            .from('demo_invitations')
            .update({
              reminder_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', demo.id);

          logger.info('Demo reminder sent', { demoId: demo.id, email: demo.invitations?.email });
        } catch (error) {
          logger.error('Error sending demo reminder', error, { demoId: demo.id });
        }
      }
    } catch (error) {
      logger.error('Failed to process demo reminders', error);
      throw error;
    }
  }
} 