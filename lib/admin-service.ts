import { EmailService } from './email-service';
import { InvitationService } from './invitation-service';
import { logger } from './logger';
import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface AdminStats {
  totalInvitations: number;
  pendingInvitations: number;
  approvedInvitations: number;
  totalStories: number;
  pendingStories: number;
  approvedStories: number;
  totalUsers: number;
  activeUsers: number;
  todaySignups: number;
  todayInvitations: number;
}

export interface InvitationManagement {
  id: string;
  email: string;
  name: string;
  interests: string[];
  issues: string[];
  status: 'pending' | 'approved' | 'rejected';
  priority: number;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  token?: string;
  expiresAt?: Date;
}

export interface StoryManagement {
  id: string;
  email: string;
  name: string;
  title: string;
  story: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
  publishedAt?: Date;
}

export interface UserManagement {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'individual' | 'enterprise' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin?: Date;
  sessionsUsed: number;
  totalSessions: number;
  subscriptionStatus?: string;
}

export class AdminService {
  /**
   * Check if user has admin permissions
   */
  static async checkAdminAccess(userId: string): Promise<{ isAdmin: boolean; role?: string; permissions?: string[] }> {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active')
        .eq('user_id', userId)
        .single();

      if (error || !adminData || !adminData.is_active) {
        return { isAdmin: false };
      }

      return {
        isAdmin: true,
        role: adminData.role,
        permissions: adminData.permissions || []
      };
    } catch (error) {
      logger.error('Failed to check admin access');
      return { isAdmin: false };
    }
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get invitation stats
      const { data: invitations } = await supabase
        .from('invitation_requests')
        .select('status, created_at');

      const totalInvitations = invitations?.length || 0;
      const pendingInvitations = invitations?.filter(i => i.status === 'pending').length || 0;
      const approvedInvitations = invitations?.filter(i => i.status === 'approved').length || 0;
      const todayInvitations = invitations?.filter(i => new Date(i.created_at) >= today).length || 0;

      // Get story stats
      const { data: stories } = await supabase
        .from('stories')
        .select('status, created_at');

      const totalStories = stories?.length || 0;
      const pendingStories = stories?.filter(s => s.status === 'pending').length || 0;
      const approvedStories = stories?.filter(s => s.status === 'approved' || s.status === 'published').length || 0;

      // Get user stats
      const { data: users } = await supabase
        .from('users')
        .select('created_at, last_login, status');

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.status === 'active').length || 0;
      const todaySignups = users?.filter(u => new Date(u.created_at) >= today).length || 0;

      return {
        totalInvitations,
        pendingInvitations,
        approvedInvitations,
        totalStories,
        pendingStories,
        approvedStories,
        totalUsers,
        activeUsers,
        todaySignups,
        todayInvitations
      };
    } catch (error) {
      logger.error('Failed to get admin stats');
      throw error;
    }
  }

  /**
   * Get invitation requests for admin review
   */
  static async getInvitationRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ data: InvitationManagement[]; total: number }> {
    try {
      let query = supabase
        .from('invitation_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data?.map(item => ({
          id: item.id,
          email: item.email,
          name: item.name,
          interests: item.interests || [],
          issues: item.issues || [],
          status: item.status,
          priority: item.priority || 0,
          createdAt: new Date(item.created_at),
          approvedAt: item.approved_at ? new Date(item.approved_at) : undefined,
          approvedBy: item.approved_by,
          token: item.token,
          expiresAt: item.expires_at ? new Date(item.expires_at) : undefined
        })) || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get invitation requests');
      throw error;
    }
  }

  /**
   * Approve invitation request
   */
  static async approveInvitation(
    requestId: string,
    adminId: string,
    sendEmail: boolean = true
  ): Promise<{ success: boolean; token?: string }> {
    try {
      // Get the request
      const { data: request, error: fetchError } = await supabase
        .from('invitation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        throw new Error('Invitation request not found');
      }

      // Create invitation using existing service
      const invitationResult = await InvitationService.createInvitation({
        email: request.email,
        name: request.name,
        createdBy: adminId,
        expiryDays: 7,
        invitationType: 'regular',
        language: request.language || 'en'
      });

      if (!invitationResult.success || !invitationResult.token) {
        throw new Error('Failed to create invitation');
      }

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update request status
      const { error: updateError } = await supabase
        .from('invitation_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminId,
          token: invitationResult.token,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      // Send email if requested
      if (sendEmail) {
        await EmailService.sendInvitationEmail({
          recipientName: request.name,
          recipientEmail: request.email,
          invitationToken: invitationResult.token,
          expiresAt: expiresAt,
          inviterName: 'DrishiQ Admin Team'
        });
      }

      logger.info('Invitation approved', { requestId, adminId });

      return { success: true, token: invitationResult.token };
    } catch (error) {
      logger.error('Failed to approve invitation');
      throw error;
    }
  }

  /**
   * Reject invitation request
   */
  static async rejectInvitation(
    requestId: string,
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('invitation_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          admin_notes: reason
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      logger.info('Invitation rejected', { requestId, adminId, reason });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reject invitation');
      throw error;
    }
  }

  /**
   * Get stories for admin review
   */
  static async getStories(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ data: StoryManagement[]; total: number }> {
    try {
      let query = supabase
        .from('stories')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data?.map(item => ({
          id: item.id,
          email: item.email,
          name: item.name,
          title: item.title,
          story: item.story,
          category: item.category,
          status: item.status,
          createdAt: new Date(item.created_at),
          reviewedAt: item.reviewed_at ? new Date(item.reviewed_at) : undefined,
          reviewedBy: item.reviewed_by,
          adminNotes: item.admin_notes,
          publishedAt: item.published_at ? new Date(item.published_at) : undefined
        })) || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get stories');
      throw error;
    }
  }

  /**
   * Review story (approve/reject)
   */
  static async reviewStory(
    storyId: string,
    adminId: string,
    action: 'approve' | 'reject' | 'publish',
    notes?: string,
    grantInvitation?: boolean
  ): Promise<{ success: boolean }> {
    try {
      // Get the story
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (fetchError || !story) {
        throw new Error('Story not found');
      }

      const newStatus = action === 'approve' ? 'approved' : 
                     action === 'reject' ? 'rejected' : 'published';

      // Update story status
      const updateData: any = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: notes
      };

      if (action === 'publish') {
        updateData.published_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId);

      if (updateError) {
        throw updateError;
      }

      // Create invitation if story is approved/published and requested
      let invitationToken = '';
      if ((action === 'approve' || action === 'publish') && grantInvitation) {
        const invitationResult = await InvitationService.createInvitation({
          email: story.email,
          name: story.name,
          createdBy: adminId,
          expiryDays: 7,
          invitationType: 'story_reward',
          language: story.language || 'en'
        });

        if (invitationResult.success && invitationResult.token) {
          invitationToken = invitationResult.token;
        }
      }

      // Send status email
      await EmailService.sendStoryStatusEmail({
        recipientName: story.name,
        recipientEmail: story.email,
        storyTitle: story.title,
        status: newStatus as 'approved' | 'rejected' | 'published',
        adminNotes: notes,
        invitationToken: invitationToken || undefined
      });

      logger.info('Story reviewed', { storyId, adminId, action });

      return { success: true };
    } catch (error) {
      logger.error('Failed to review story');
      throw error;
    }
  }

  /**
   * Get users for admin management
   */
  static async getUsers(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ data: UserManagement[]; total: number }> {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data?.map(item => ({
          id: item.id,
          email: item.email,
          name: item.name,
          phone: item.phone,
          userType: item.user_type || 'individual',
          status: item.status || 'active',
          createdAt: new Date(item.created_at),
          lastLogin: item.last_login ? new Date(item.last_login) : undefined,
          sessionsUsed: item.sessions_used || 0,
          totalSessions: item.total_sessions || 0,
          subscriptionStatus: item.subscription_status
        })) || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get users');
      throw error;
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(
    userId: string,
    status: 'active' | 'inactive' | 'suspended',
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Log the action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action: 'user_status_update',
          target_id: userId,
          details: { status, reason }
        });

      logger.info('User status updated', { userId, status, adminId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update user status');
      throw error;
    }
  }

  /**
   * Get admin action logs
   */
  static async getAdminLogs(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: any[]; total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin_users(email, role)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Failed to get admin logs');
      throw error;
    }
  }

  /**
   * Bulk approve invitations
   */
  static async bulkApproveInvitations(
    requestIds: string[],
    adminId: string
  ): Promise<{ success: boolean; approved: number; failed: number }> {
    let approved = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      try {
        await this.approveInvitation(requestId, adminId, true);
        approved++;
      } catch (error) {
        failed++;
        logger.error('Failed to approve invitation in bulk');
      }
    }

    return { success: true, approved, failed };
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get system settings');
      throw error;
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(
    settings: any,
    adminId: string
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: adminId
        });

      if (error) {
        throw error;
      }

      logger.info('System settings updated', { adminId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update system settings');
      throw error;
    }
  }

  static async sendMagicLink(requestIds: string[], adminId: string): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const id of requestIds) {
      try {
        // Fetch invitation by id
        const { data: invitation, error } = await supabase
          .from('Invitations')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !invitation) {
          failed++;
          continue;
        }
        // Generate magic link token if not present
        let token = invitation.token;
        if (!token) {
          token = InvitationService.generateToken();
          await supabase
            .from('Invitations')
            .update({ token })
            .eq('id', id);
        }
        // Send magic link email (implement EmailService.sendMagicLink as needed)
        await EmailService.sendMagicLink(invitation.email, token, invitation.name);
        // Update status to 'magic_link_sent'
        await supabase
          .from('Invitations')
          .update({ status: 'magic_link_sent' })
          .eq('id', id);
        sent++;
      } catch (err) {
        logger.error('Failed to send magic link for invitation', { id, err });
        failed++;
      }
    }
    return { success: failed === 0, sent, failed };
  }

  static async discardInvitations(requestIds: string[], adminId: string): Promise<{ success: boolean; discarded: number; failed: number }> {
    let discarded = 0;
    let failed = 0;
    for (const id of requestIds) {
      try {
        const { error } = await supabase
          .from('Invitations')
          .update({ status: 'discarded' })
          .eq('id', id);
        if (error) {
          failed++;
        } else {
          discarded++;
        }
      } catch (err) {
        logger.error('Failed to discard invitation', { id, err });
        failed++;
      }
    }
    return { success: failed === 0, discarded, failed };
  }
} 