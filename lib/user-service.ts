import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  city?: string;
  country?: string;
  occupation?: string;
  company?: string;
  job_title?: string;
  industry?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  education_level?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'other';
  interests?: string[];
  skills?: string[];
  timezone?: string;
  preferred_communication?: 'email' | 'sms' | 'push' | 'in_app';
  preferred_language?: string;
  notification_settings?: Record<string, any>;
  privacy_settings?: Record<string, any>;
  profile_completion_percentage?: number;
  profile_updated_at?: string;
}

export interface UserSubscription {
  id: string;
  plan_name: string;
  plan_type: 'free' | 'basic' | 'premium' | 'enterprise' | 'custom';
  status: 'active' | 'expired' | 'cancelled' | 'suspended' | 'pending';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  current_period_end?: string;
  credits_included: number;
  credits_used: number;
  credits_remaining: number;
  features: Record<string, any>;
}

export interface UserResourceUsage {
  bandwidth_used_mb: number;
  bandwidth_limit_mb: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  api_calls_made: number;
  api_calls_limit: number;
  sessions_created: number;
  sessions_limit: number;
  tokens_used: number;
  tokens_limit: number;
  credits_used: number;
  credits_earned: number;
  credits_bonus: number;
}

export interface UserSession {
  id: string;
  session_type: 'web' | 'mobile' | 'api' | 'desktop';
  device_type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  browser?: string;
  os?: string;
  ip_address?: string;
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  bandwidth_used_mb: number;
  storage_used_mb: number;
  api_calls_made: number;
  tokens_used: number;
  credits_used: number;
}

export interface UserFile {
  id: string;
  file_name: string;
  file_type?: string;
  file_size_mb: number;
  status: 'uploading' | 'uploaded' | 'processing' | 'ready' | 'error' | 'deleted';
  storage_provider: 'local' | 's3' | 'supabase' | 'gcs' | 'azure';
  access_level: 'private' | 'shared' | 'public';
  download_count: number;
  tags?: string[];
  description?: string;
  created_at: string;
}

export interface UserApiToken {
  id: string;
  token_name: string;
  token_prefix: string;
  token_type: 'api_key' | 'access_token' | 'refresh_token' | 'webhook_token';
  permissions: string[];
  scopes: string[];
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  usage_count: number;
  created_at: string;
}

export interface UserDashboardSummary {
  profile_completion: number;
  subscription_status: string;
  credits_remaining: number;
  bandwidth_used_mb: number;
  bandwidth_limit_mb: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  active_sessions: number;
  total_files: number;
  api_tokens_count: number;
  unread_notifications: number;
}

export class UserService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get user profile', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('User profile updated', { user_id: userId });
      return data;
    } catch (error) {
      logger.error('Failed to update user profile', error);
      return null;
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      logger.error('Failed to get user subscription', error);
      return null;
    }
  }

  /**
   * Get user resource usage
   */
  async getUserResourceUsage(userId: string): Promise<UserResourceUsage | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_resource_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      logger.error('Failed to get user resource usage', error);
      return null;
    }
  }

  /**
   * Track resource usage
   */
  async trackResourceUsage(
    userId: string,
    bandwidthMb: number = 0,
    storageMb: number = 0,
    apiCalls: number = 0,
    tokens: number = 0,
    credits: number = 0
  ): Promise<void> {
    try {
      await this.supabase.rpc('track_resource_usage', {
        p_user_id: userId,
        p_bandwidth_mb: bandwidthMb,
        p_storage_mb: storageMb,
        p_api_calls: apiCalls,
        p_tokens: tokens,
        p_credits: credits
      });

      logger.debug('Resource usage tracked', { 
        user_id: userId, 
        bandwidth_mb: bandwidthMb, 
        storage_mb: storageMb,
        api_calls: apiCalls,
        tokens: tokens,
        credits: credits
      });
    } catch (error) {
      logger.error('Failed to track resource usage', error);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string, limit: number = 10): Promise<UserSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions_detailed')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user sessions', error);
      return [];
    }
  }

  /**
   * Get active user sessions
   */
  async getActiveUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions_detailed')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get active user sessions', error);
      return [];
    }
  }

  /**
   * Get user files
   */
  async getUserFiles(userId: string, limit: number = 20): Promise<UserFile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user files', error);
      return [];
    }
  }

  /**
   * Upload user file
   */
  async uploadUserFile(
    userId: string,
    sessionId: string,
    fileName: string,
    filePath: string,
    fileSizeBytes: number,
    fileType?: string,
    mimeType?: string,
    tags?: string[],
    description?: string
  ): Promise<UserFile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_files')
        .insert({
          user_id: userId,
          session_id: sessionId,
          file_name: fileName,
          file_path: filePath,
          file_type: fileType,
          mime_type: mimeType,
          file_size_bytes: fileSizeBytes,
          tags: tags || [],
          description: description,
          status: 'uploading'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('User file uploaded', { 
        user_id: userId, 
        file_name: fileName, 
        file_size_mb: data.file_size_mb 
      });

      return data;
    } catch (error) {
      logger.error('Failed to upload user file', error);
      return null;
    }
  }

  /**
   * Get user API tokens
   */
  async getUserApiTokens(userId: string): Promise<UserApiToken[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user API tokens', error);
      return [];
    }
  }

  /**
   * Create API token
   */
  async createApiToken(
    userId: string,
    tokenName: string,
    permissions: string[] = [],
    scopes: string[] = [],
    expiresAt?: Date
  ): Promise<{ token: UserApiToken; tokenValue: string } | null> {
    try {
      // Generate token
      const tokenValue = this.generateApiToken();
      const tokenHash = await this.hashToken(tokenValue);
      const tokenPrefix = tokenValue.substring(0, 8);

      const { data, error } = await this.supabase
        .from('user_api_tokens')
        .insert({
          user_id: userId,
          token_name: tokenName,
          token_hash: tokenHash,
          token_prefix: tokenPrefix,
          permissions: permissions,
          scopes: scopes,
          expires_at: expiresAt?.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('API token created', { 
        user_id: userId, 
        token_name: tokenName 
      });

      return { token: data, tokenValue };
    } catch (error) {
      logger.error('Failed to create API token', error);
      return null;
    }
  }

  /**
   * Get user dashboard summary
   */
  async getUserDashboardSummary(userId: string): Promise<UserDashboardSummary | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_dashboard_summary', { p_user_id: userId });

      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      logger.error('Failed to get user dashboard summary', error);
      return null;
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string,
    sessionId: string,
    activityType: string,
    activityCategory: string,
    activityData?: Record<string, any>,
    resourceUsage?: {
      bandwidthMb?: number;
      storageMb?: number;
      apiCalls?: number;
      tokens?: number;
      credits?: number;
      processingTimeMs?: number;
    }
  ): Promise<void> {
    try {
      await this.supabase
        .from('user_activity_detailed')
        .insert({
          user_id: userId,
          session_id: sessionId,
          activity_type: activityType,
          activity_category: activityCategory,
          activity_data: activityData || {},
          bandwidth_used_mb: resourceUsage?.bandwidthMb || 0,
          storage_used_mb: resourceUsage?.storageMb || 0,
          api_calls_made: resourceUsage?.apiCalls || 0,
          tokens_used: resourceUsage?.tokens || 0,
          credits_used: resourceUsage?.credits || 0,
          processing_time_ms: resourceUsage?.processingTimeMs
        });

      logger.debug('User activity logged', { 
        user_id: userId, 
        activity_type: activityType,
        activity_category: activityCategory
      });
    } catch (error) {
      logger.error('Failed to log user activity', error);
    }
  }

  /**
   * Generate API token
   */
  private generateApiToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash token (in production, use proper hashing)
   */
  private async hashToken(token: string): Promise<string> {
    // In production, use proper hashing like bcrypt or crypto
    return btoa(token); // Simple base64 encoding for demo
  }

  /**
   * Get user storage usage
   */
  async getUserStorageUsage(userId: string): Promise<{
    totalFiles: number;
    totalSizeMb: number;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('user_files')
        .select('file_size_mb, file_type')
        .eq('user_id', userId)
        .neq('status', 'deleted');

      if (error) throw error;

      const totalFiles = data.length;
      const totalSizeMb = data.reduce((sum, file) => sum + (file.file_size_mb || 0), 0);
      
      const byType: Record<string, number> = {};
      data.forEach(file => {
        const type = file.file_type || 'unknown';
        byType[type] = (byType[type] || 0) + (file.file_size_mb || 0);
      });

      return { totalFiles, totalSizeMb, byType };
    } catch (error) {
      logger.error('Failed to get user storage usage', error);
      return { totalFiles: 0, totalSizeMb: 0, byType: {} };
    }
  }

  /**
   * Get user bandwidth usage
   */
  async getUserBandwidthUsage(userId: string, days: number = 30): Promise<{
    totalMb: number;
    dailyUsage: Array<{ date: string; mb: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('user_activity_detailed')
        .select('bandwidth_used_mb, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalMb = data.reduce((sum, activity) => sum + (activity.bandwidth_used_mb || 0), 0);
      
      // Group by date
      const dailyUsage: Record<string, number> = {};
      data.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        dailyUsage[date] = (dailyUsage[date] || 0) + (activity.bandwidth_used_mb || 0);
      });

      const dailyArray = Object.entries(dailyUsage).map(([date, mb]) => ({ date, mb }));

      return { totalMb, dailyUsage: dailyArray };
    } catch (error) {
      logger.error('Failed to get user bandwidth usage', error);
      return { totalMb: 0, dailyUsage: [] };
    }
  }
} 