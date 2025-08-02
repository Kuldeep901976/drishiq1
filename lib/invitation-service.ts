import crypto from 'crypto';
import { logger } from './logger';
import { supabase } from './supabase';

export interface InvitationData {
  name: string;
  email: string;
  phone?: string;
  language: string;
  location?: string;
  invitationType?: 'regular' | 'demo' | 'enterprise' | 'referral' | 'story_reward';
  createdBy?: string;
  expiryDays?: number;
  challenge?: string; // Optional field for challenge/problem to share
}

export interface InvitationRequest {
  email: string;
  phone?: string;
  fullName: string;
  language: string;
  interests: string[];
  issues: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export class InvitationService {
  private static readonly DEFAULT_EXPIRY_DAYS = 7;
  private static readonly DAILY_AUTO_APPROVE_LIMIT = 51;

  /**
   * Generate a secure invitation token
   */
  public static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation
   */
  static async createInvitation(data: InvitationData): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const token = this.generateToken();
      const expiryDays = data.expiryDays || this.DEFAULT_EXPIRY_DAYS;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { data: invitation, error } = await supabase
        .from('Invitations')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          language: data.language,
          location: data.location,
          token,
          expires_at: expiresAt.toISOString(),
          invitation_type: data.invitationType || 'regular',
          created_by: data.createdBy,
          status: 'pending',
          challenge: data.challenge // Add challenge field to insert
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create invitation');
        return { success: false, error: error.message };
      }

      logger.info('Invitation created successfully');
      return { success: true, token };
    } catch (error) {
      logger.error('Error creating invitation');
      return { success: false, error: 'Failed to create invitation' };
    }
  }

  /**
   * Validate invitation token
   */
  static async validateToken(token: string): Promise<{ valid: boolean; invitation?: any; error?: string }> {
    try {
      const { data: invitation, error } = await supabase
        .from('Invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !invitation) {
        return { valid: false, error: 'Invalid invitation token' };
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      
      if (now > expiresAt) {
        return { valid: false, error: 'Invitation has expired' };
      }

      // Check if already used
      if (invitation.status === 'used') {
        return { valid: false, error: 'Invitation has already been used' };
      }

      return { valid: true, invitation };
    } catch (error) {
      logger.error('Error validating token');
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Mark invitation as used
   */
  static async markInvitationUsed(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('Invitations')
        .update({ 
          status: 'used', 
          used_at: new Date().toISOString() 
        })
        .eq('token', token);

      if (error) {
        logger.error('Failed to mark invitation as used');
        return { success: false, error: error.message };
      }

      logger.info('Invitation marked as used');
      return { success: true };
    } catch (error) {
      logger.error('Error marking invitation as used');
      return { success: false, error: 'Failed to update invitation status' };
    }
  }

  /**
   * Reactivate expired invitation
   */
  static async reactivateInvitation(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Find the most recent invitation for this email
      const { data: invitation, error: fetchError } = await supabase
        .from('Invitations')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !invitation) {
        return { success: false, error: 'No invitation found for this email' };
      }

      // Generate new token and extend expiry
      const newToken = this.generateToken();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + this.DEFAULT_EXPIRY_DAYS);

      const { error: updateError } = await supabase
        .from('Invitations')
        .update({
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          status: 'pending',
          reactivation_count: (invitation.reactivation_count || 0) + 1
        })
        .eq('id', invitation.id);

      if (updateError) {
        logger.error('Failed to reactivate invitation');
        return { success: false, error: updateError.message };
      }

      logger.info('Invitation reactivated');
      return { success: true, token: newToken };
    } catch (error) {
      logger.error('Error reactivating invitation');
      return { success: false, error: 'Failed to reactivate invitation' };
    }
  }

  /**
   * Submit invitation request (for non-invited users)
   */
  static async submitInvitationRequest(data: InvitationRequest): Promise<{ success: boolean; autoApproved?: boolean; error?: string }> {
    try {
      // Check if user already has a pending request
      const { data: existingRequest } = await supabase
        .from('invitation_requests')
        .select('*')
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        return { success: false, error: 'You already have a pending invitation request' };
      }

      // Calculate priority score (simplified logic)
      const priorityScore = this.calculatePriorityScore(data);

      // Check if we can auto-approve today
      const today = new Date().toISOString().split('T')[0];
      const { count: todayApproved } = await supabase
        .from('invitation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('processed_at', today + 'T00:00:00');

      const autoApproved = (todayApproved || 0) < this.DAILY_AUTO_APPROVE_LIMIT;

      const { error } = await supabase
        .from('invitation_requests')
        .insert([{
          email: data.email,
          phone: data.phone,
          full_name: data.fullName,
          language: data.language,
          interests: data.interests,
          issues: data.issues,
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          referrer: data.referrer,
          priority_score: priorityScore,
          auto_approved: autoApproved,
          status: autoApproved ? 'approved' : 'pending',
          processed_at: autoApproved ? new Date().toISOString() : null
        }]);

      if (error) {
        logger.error('Failed to submit invitation request');
        return { success: false, error: error.message };
      }

      // If auto-approved, create the invitation
      if (autoApproved) {
        const invitationResult = await this.createInvitation({
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          language: data.language,
          invitationType: 'regular'
        });

        if (!invitationResult.success) {
          logger.error('Failed to create invitation for auto-approved request');
          return { success: false, error: 'Failed to create invitation' };
        }
      }

      logger.info('Invitation request submitted');
      return { success: true, autoApproved };
    } catch (error) {
      logger.error('Error submitting invitation request');
      return { success: false, error: 'Failed to submit request' };
    }
  }

  /**
   * Calculate priority score for invitation requests
   */
  private static calculatePriorityScore(data: InvitationRequest): number {
    let score = 0;
    
    // Base score
    score += 10;
    
    // Bonus for multiple interests
    score += data.interests.length * 5;
    
    // Bonus for specific issues
    score += data.issues.length * 3;
    
    // Bonus for having phone number
    if (data.phone) score += 5;
    
    // Bonus for referral source
    if (data.referrer) score += 10;
    
    // UTM source bonus
    if (data.utmSource) score += 5;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get invitation analytics
   */
  static async getInvitationAnalytics(): Promise<any> {
    try {
      const { data: stats, error } = await supabase
        .from('Invitations')
        .select('status, invitation_type, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch invitation analytics');
        return null;
      }

      const analytics = {
        total: stats.length,
        pending: stats.filter(s => s.status === 'pending').length,
        used: stats.filter(s => s.status === 'used').length,
        expired: stats.filter(s => s.status === 'expired').length,
        byType: stats.reduce((acc, s) => {
          acc[s.invitation_type] = (acc[s.invitation_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return analytics;
    } catch (error) {
      logger.error('Error fetching invitation analytics');
      return null;
    }
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      const { error } = await supabase
        .from('Invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Failed to cleanup expired invitations');
      } else {
        logger.info('Expired invitations cleanup completed');
      }
    } catch (error) {
      logger.error('Error during invitation cleanup');
    }
  }
} 