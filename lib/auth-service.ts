import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

export interface AuthEvent {
  user_id?: string;
  email: string;
  event_type: 'signup_attempt' | 'signup_success' | 'signup_failed' |
              'signin_attempt' | 'signin_success' | 'signin_failed' |
              'password_reset_attempt' | 'password_reset_success' | 'password_reset_failed' |
              'email_verification_attempt' | 'email_verification_success' | 'email_verification_failed' |
              'phone_verification_attempt' | 'phone_verification_success' | 'phone_verification_failed' |
              'social_signin_attempt' | 'social_signin_success' | 'social_signin_failed' |
              'logout' | 'session_expired' | 'account_locked' | 'account_unlocked';
  auth_provider?: 'email' | 'google' | 'facebook' | 'linkedin' | 'phone';
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface UserSession {
  user_id: string;
  session_token: string;
  refresh_token?: string;
  auth_provider: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  location_info?: Record<string, any>;
  expires_at: Date;
  metadata?: Record<string, any>;
}

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(event: AuthEvent, request?: Request): Promise<void> {
    try {
      const clientInfo = this.extractClientInfo(request);
      
      await this.supabase
        .from('auth_events')
        .insert({
          user_id: event.user_id,
          email: event.email,
          event_type: event.event_type,
          auth_provider: event.auth_provider,
          ip_address: clientInfo.ip_address,
          user_agent: clientInfo.user_agent,
          device_info: clientInfo.device_info,
          location_info: clientInfo.location_info,
          success: event.success,
          error_message: event.error_message,
          metadata: event.metadata || {}
        });

      logger.info('Auth event logged', { 
        event_type: event.event_type, 
        email: event.email, 
        success: event.success 
      });
    } catch (error) {
      logger.error('Failed to log auth event', error);
    }
  }

  /**
   * Create user session
   */
  async createUserSession(session: UserSession): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: session.user_id,
          session_token: session.session_token,
          refresh_token: session.refresh_token,
          auth_provider: session.auth_provider,
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          device_info: session.device_info || {},
          location_info: session.location_info || {},
          expires_at: session.expires_at.toISOString(),
          metadata: session.metadata || {}
        })
        .select('id')
        .single();

      if (error) throw error;

      logger.info('User session created', { 
        session_id: data.id, 
        user_id: session.user_id 
      });

      return data.id;
    } catch (error) {
      logger.error('Failed to create user session', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);

      logger.debug('Session activity updated', { session_id: sessionId });
    } catch (error) {
      logger.error('Failed to update session activity', error);
    }
  }

  /**
   * End user session
   */
  async endUserSession(sessionId: string, reason: string = 'user_logout'): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          logout_reason: reason
        })
        .eq('id', sessionId);

      logger.info('User session ended', { 
        session_id: sessionId, 
        reason 
      });
    } catch (error) {
      logger.error('Failed to end user session', error);
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string, 
    sessionId: string, 
    activityType: string, 
    activityData?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          session_id: sessionId,
          activity_type: activityType,
          activity_data: activityData || {}
        });

      logger.debug('User activity logged', { 
        user_id: userId, 
        activity_type: activityType 
      });
    } catch (error) {
      logger.error('Failed to log user activity', error);
    }
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(userId: string, ipAddress?: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];

      // Check failed login attempts
      const { data: failedAttempts } = await this.supabase
        .from('auth_events')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event_type', 'signin_failed')
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

      if (failedAttempts && failedAttempts.length >= 5) {
        reasons.push('Multiple failed login attempts');
      }

      // Check for unusual IP addresses (if we have location data)
      if (ipAddress) {
        const { data: recentSessions } = await this.supabase
          .from('user_sessions')
          .select('ip_address, location_info')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('started_at', { ascending: false })
          .limit(5);

        // Simple check for IP changes (in production, use geolocation service)
        if (recentSessions && recentSessions.length > 0) {
          const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
          if (uniqueIPs.size > 3) {
            reasons.push('Multiple IP addresses in recent sessions');
          }
        }
      }

      const suspicious = reasons.length > 0;

      if (suspicious) {
        await this.logSecurityEvent(userId, 'suspicious_login', 'medium', reasons.join(', '));
      }

      return { suspicious, reasons };
    } catch (error) {
      logger.error('Failed to check suspicious activity', error);
      return { suspicious: false, reasons: [] };
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          severity,
          description
        });

      logger.warn('Security event logged', { 
        user_id: userId, 
        event_type: eventType, 
        severity 
      });
    } catch (error) {
      logger.error('Failed to log security event', error);
    }
  }

  /**
   * Get user session summary
   */
  async getUserSessionSummary(userId: string): Promise<{
    total_sessions: number;
    active_sessions: number;
    last_signin: string | null;
    failed_attempts: number;
    account_locked: boolean;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_session_summary', { p_user_id: userId });

      if (error) throw error;

      return data[0] || {
        total_sessions: 0,
        active_sessions: 0,
        last_signin: null,
        failed_attempts: 0,
        account_locked: false
      };
    } catch (error) {
      logger.error('Failed to get user session summary', error);
      throw error;
    }
  }

  /**
   * Extract client information from request
   */
  private extractClientInfo(request?: Request): {
    ip_address?: string;
    user_agent?: string;
    device_info: Record<string, any>;
    location_info: Record<string, any>;
  } {
    if (!request) {
      return {
        device_info: {},
        location_info: {}
      };
    }

    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = realIP || forwardedFor?.split(',')[0] || '';

    // Basic device detection (in production, use a proper device detection library)
    const deviceInfo = {
      is_mobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      is_tablet: /iPad|Android.*Tablet/.test(userAgent),
      is_desktop: !/Mobile|Android|iPhone|iPad/.test(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent)
    };

    return {
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      location_info: {} // In production, use IP geolocation service
    };
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
} 