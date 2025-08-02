import { logger } from './logger';
import { supabase } from './supabase';

export class SupabaseAuthService {
  /**
   * Send magic link to user's email
   */
  static async sendMagicLink(email: string, redirectTo?: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          data: {
            // You can add custom metadata here
            invitation_type: 'regular'
          }
        }
      });

      if (error) {
        logger.error('Error sending magic link:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Error in sendMagicLink:', error);
      return { success: false, error: 'Failed to send magic link' };
    }
  }

  /**
   * Verify magic link token
   */
  static async verifyMagicLink(token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        logger.error('Error verifying magic link:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Error in verifyMagicLink:', error);
      return { success: false, error: 'Failed to verify magic link' };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.error('Error getting current user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, user };
    } catch (error) {
      logger.error('Error in getCurrentUser:', error);
      return { success: false, error: 'Failed to get current user' };
    }
  }

  /**
   * Sign out user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Error signing out:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error in signOut:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  }
} 