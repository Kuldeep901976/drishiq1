import { nanoid } from 'nanoid';
import { supabase } from './supabase';
import { logger } from './logger';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  status: 'active' | 'suspended' | 'trial' | 'expired' | 'cancelled';
  billing_email?: string;
  tax_id?: string;
  max_users: number;
  max_credits: number;
  features: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  permissions: Record<string, any>;
  is_active: boolean;
  joined_at: string;
  last_activity_at?: string;
  invited_by?: string;
  invited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message?: string;
  permissions: Record<string, any>;
  expires_at: string;
  max_uses: number;
  used_count: number;
  invited_by: string;
  accepted_by?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreditPool {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  allocation_rules: Record<string, any>;
  auto_refill: boolean;
  refill_threshold: number;
  refill_amount: number;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  daily_used: number;
  weekly_used: number;
  monthly_used: number;
  daily_reset_at: string;
  weekly_reset_at: string;
  monthly_reset_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreditAllocation {
  id: string;
  organization_id: string;
  user_id: string;
  credit_pool_id: string;
  allocated_credits: number;
  used_credits: number;
  available_credits: number;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  daily_used: number;
  weekly_used: number;
  monthly_used: number;
  daily_reset_at: string;
  weekly_reset_at: string;
  monthly_reset_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationActivityLog {
  id: string;
  organization_id: string;
  user_id?: string;
  activity_type: string;
  activity_description?: string;
  activity_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export class EnterpriseService {
  private supabase = supabase;

  // Organization Management
  async createOrganization(params: {
    name: string;
    slug: string;
    description?: string;
    industry?: string;
    size?: string;
    contact_email?: string;
    owner_id: string;
  }): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .rpc('create_organization_with_owner', {
          org_name: params.name,
          org_slug: params.slug,
          owner_id: params.owner_id
        });

      if (error) throw error;

      // Get the created organization
      const { data: organization, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', data)
        .single();

      if (orgError) throw orgError;

      logger.info(`Organization created: ${organization.name}`, { organizationId: data });
      return organization;
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching organization:', error);
      throw error;
    }
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(id, 'organization_updated', 'Organization details updated', updates);
      logger.info(`Organization updated: ${id}`);
      return data;
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner(user_id, role, is_active)
        `)
        .eq('organization_members.user_id', userId)
        .eq('organization_members.is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user organizations:', error);
      throw error;
    }
  }

  // Member Management
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select(`
          *,
          users(id, email, name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching organization members:', error);
      throw error;
    }
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    role: OrganizationMember['role'],
    permissions?: Record<string, any>
  ): Promise<OrganizationMember> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .update({
          role,
          permissions: permissions || {},
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(organizationId, 'member_role_updated', 
        `Member role updated to ${role}`, { memberId, role });
      logger.info(`Member role updated: ${memberId} to ${role}`);
      return data;
    } catch (error) {
      logger.error('Error updating member role:', error);
      throw error;
    }
  }

  async removeMember(organizationId: string, memberId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('id', memberId);

      if (error) throw error;

      await this.logActivity(organizationId, 'member_removed', 
        'Member removed from organization', { memberId });
      logger.info(`Member removed: ${memberId} from organization ${organizationId}`);
    } catch (error) {
      logger.error('Error removing member:', error);
      throw error;
    }
  }

  async deactivateMember(organizationId: string, memberId: string): Promise<OrganizationMember> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(organizationId, 'member_deactivated', 
        'Member deactivated', { memberId });
      logger.info(`Member deactivated: ${memberId}`);
      return data;
    } catch (error) {
      logger.error('Error deactivating member:', error);
      throw error;
    }
  }

  // Invitation Management
  async createInvitation(params: {
    organization_id: string;
    email: string;
    role: OrganizationMember['role'];
    message?: string;
    permissions?: Record<string, any>;
    invited_by: string;
    expires_in_days?: number;
  }): Promise<OrganizationInvitation> {
    try {
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expires_in_days || 7));

      const { data, error } = await this.supabase
        .from('organization_invitations')
        .insert({
          organization_id: params.organization_id,
          email: params.email,
          role: params.role,
          token,
          message: params.message,
          permissions: params.permissions || {},
          expires_at: expiresAt.toISOString(),
          invited_by: params.invited_by
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(params.organization_id, 'invitation_created', 
        `Invitation sent to ${params.email}`, { email: params.email, role: params.role });
      
      logger.info(`Invitation created for ${params.email} in organization ${params.organization_id}`);
      return data;
    } catch (error) {
      logger.error('Error creating invitation:', error);
      throw error;
    }
  }

  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_invitations')
        .select(`
          *,
          invited_by_user:users!organization_invitations_invited_by_fkey(email, name),
          accepted_by_user:users!organization_invitations_accepted_by_fkey(email, name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching organization invitations:', error);
      throw error;
    }
  }

  async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .rpc('accept_organization_invitation', {
          invitation_token: token,
          accepting_user_id: userId
        });

      if (error) throw error;

      if (data.success) {
        logger.info(`Invitation accepted by user ${userId}`);
        return { success: true };
      } else {
        logger.warn(`Invitation acceptance failed: ${data.error}`);
        return { success: false, error: data.error };
      }
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async cancelInvitation(organizationId: string, invitationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('organization_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', invitationId);

      if (error) throw error;

      await this.logActivity(organizationId, 'invitation_cancelled', 
        'Invitation cancelled', { invitationId });
      logger.info(`Invitation cancelled: ${invitationId}`);
    } catch (error) {
      logger.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  async resendInvitation(organizationId: string, invitationId: string): Promise<OrganizationInvitation> {
    try {
      const newToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await this.supabase
        .from('organization_invitations')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(organizationId, 'invitation_resent', 
        'Invitation resent', { invitationId });
      logger.info(`Invitation resent: ${invitationId}`);
      return data;
    } catch (error) {
      logger.error('Error resending invitation:', error);
      throw error;
    }
  }

  // Credit Pool Management
  async createCreditPool(params: {
    organization_id: string;
    name: string;
    description?: string;
    total_credits: number;
    allocation_rules?: Record<string, any>;
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
  }): Promise<OrganizationCreditPool> {
    try {
      const { data, error } = await this.supabase
        .from('organization_credit_pools')
        .insert({
          organization_id: params.organization_id,
          name: params.name,
          description: params.description,
          total_credits: params.total_credits,
          allocation_rules: params.allocation_rules || {},
          daily_limit: params.daily_limit || 0,
          weekly_limit: params.weekly_limit || 0,
          monthly_limit: params.monthly_limit || 0
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(params.organization_id, 'credit_pool_created', 
        `Credit pool "${params.name}" created`, { name: params.name, credits: params.total_credits });
      
      logger.info(`Credit pool created: ${params.name} with ${params.total_credits} credits`);
      return data;
    } catch (error) {
      logger.error('Error creating credit pool:', error);
      throw error;
    }
  }

  async getOrganizationCreditPools(organizationId: string): Promise<OrganizationCreditPool[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_credit_pools')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching credit pools:', error);
      throw error;
    }
  }

  async allocateCreditsToUser(params: {
    organization_id: string;
    user_id: string;
    credit_pool_id: string;
    allocated_credits: number;
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
  }): Promise<UserCreditAllocation> {
    try {
      const { data, error } = await this.supabase
        .from('user_credit_allocations')
        .upsert({
          organization_id: params.organization_id,
          user_id: params.user_id,
          credit_pool_id: params.credit_pool_id,
          allocated_credits: params.allocated_credits,
          daily_limit: params.daily_limit || 0,
          weekly_limit: params.weekly_limit || 0,
          monthly_limit: params.monthly_limit || 0
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity(params.organization_id, 'credits_allocated', 
        `${params.allocated_credits} credits allocated to user`, { 
          user_id: params.user_id, 
          credits: params.allocated_credits 
        });
      
      logger.info(`Credits allocated: ${params.allocated_credits} to user ${params.user_id}`);
      return data;
    } catch (error) {
      logger.error('Error allocating credits:', error);
      throw error;
    }
  }

  async getUserCreditAllocations(organizationId: string, userId: string): Promise<UserCreditAllocation[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_credit_allocations')
        .select(`
          *,
          credit_pool:organization_credit_pools(name, description)
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user credit allocations:', error);
      throw error;
    }
  }

  // Permission Management
  async hasPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      if (error || !data) return false;

      // Check role-based permissions
      const rolePermissions: Record<string, string[]> = {
        owner: ['*'],
        admin: ['manage_members', 'manage_billing', 'manage_credits', 'view_analytics'],
        manager: ['manage_members', 'manage_credits', 'view_analytics'],
        member: ['view_members', 'view_credits'],
        viewer: ['view_members']
      };

      const rolePerms = rolePermissions[data.role] || [];
      if (rolePerms.includes('*') || rolePerms.includes(permission)) {
        return true;
      }

      // Check custom permissions
      if (data.permissions && data.permissions[permission]) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  async getUserRole(userId: string, organizationId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data.role;
    } catch (error) {
      logger.error('Error fetching user role:', error);
      return null;
    }
  }

  // Analytics
  async getOrganizationAnalytics(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('organization_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching organization analytics:', error);
      throw error;
    }
  }

  async getOrganizationMemberAnalytics(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('organization_member_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching organization member analytics:', error);
      throw error;
    }
  }

  async getOrganizationActivityLogs(organizationId: string, limit: number = 50): Promise<OrganizationActivityLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_activity_logs')
        .select(`
          *,
          user:users(email, name)
        `)
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching organization activity logs:', error);
      throw error;
    }
  }

  // Activity Logging
  private async logActivity(
    organizationId: string,
    activityType: string,
    description?: string,
    data?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('organization_activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          activity_type: activityType,
          activity_description: description,
          activity_data: data || {}
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw error for activity logging
    }
  }

  // Utility Methods
  async checkOrganizationLimits(organizationId: string): Promise<{
    canAddUsers: boolean;
    canAddCredits: boolean;
    currentUsers: number;
    maxUsers: number;
    currentCredits: number;
    maxCredits: number;
  }> {
    try {
      const analytics = await this.getOrganizationAnalytics(organizationId);
      const organization = await this.getOrganization(organizationId);
      
      if (!analytics || !organization) {
        throw new Error('Organization not found');
      }

      return {
        canAddUsers: analytics.active_members < organization.max_users,
        canAddCredits: analytics.used_credits < organization.max_credits,
        currentUsers: analytics.active_members,
        maxUsers: organization.max_users,
        currentCredits: analytics.used_credits,
        maxCredits: organization.max_credits
      };
    } catch (error) {
      logger.error('Error checking organization limits:', error);
      throw error;
    }
  }

  async generateInvitationUrl(token: string, baseUrl: string = ''): Promise<string> {
    return `${baseUrl}/invite/${token}`;
  }
}

export const enterpriseService = new EnterpriseService(); 