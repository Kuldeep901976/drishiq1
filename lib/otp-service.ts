import { EmailService } from './email-service';
import { logger } from './logger';
import { supabase } from './supabase';

export interface OTPData {
  id: string;
  email: string;
  phone?: string;
  code: string;
  purpose: 'phone_verification' | 'email_verification' | 'password_reset';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

export interface SendOTPRequest {
  email: string;
  phone?: string;
  name?: string;
  purpose: 'phone_verification' | 'email_verification' | 'password_reset';
  language?: string;
}

export interface VerifyOTPRequest {
  email: string;
  code: string;
  purpose: 'phone_verification' | 'email_verification' | 'password_reset';
}

export class OTPService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly EXPIRY_MINUTES = 10;
  private static readonly RATE_LIMIT_MINUTES = 2; // Wait 2 minutes before sending another OTP

  /**
   * Generate a 6-digit OTP code
   */
  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP code via email
   */
  static async sendOTP(request: SendOTPRequest): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
    try {
      // Check rate limit
      const rateLimitCheck = await this.checkRateLimit(request.email, request.purpose);
      if (!rateLimitCheck.allowed) {
        return { 
          success: false, 
          error: `Please wait ${rateLimitCheck.retryAfter} minutes before requesting another code`,
          retryAfter: rateLimitCheck.retryAfter
        };
      }

      // Generate OTP code
      const code = this.generateOTPCode();
      const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

      // Store in database
      const { error: dbError } = await supabase
        .from('otp_codes')
        .insert({
          email: request.email,
          phone: request.phone,
          code,
          purpose: request.purpose,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified: false
        });

      if (dbError) {
        logger.error('Failed to store OTP in database');
        return { success: false, error: 'Failed to store OTP' };
      }

      // Send email
      const emailResult = await EmailService.sendOTPEmail({
        recipientName: request.name || 'User',
        recipientEmail: request.email,
        otpCode: code,
        expiresInMinutes: this.EXPIRY_MINUTES,
        purpose: request.purpose
      });

      if (!emailResult.success) {
        return { success: false, error: 'Failed to send verification email' };
      }

      logger.info('OTP sent successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to send OTP');
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(request: VerifyOTPRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Get OTP from database
      const { data: otpData, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', request.email)
        .eq('purpose', request.purpose)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpData) {
        return { success: false, error: 'No verification code found' };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(otpData.expires_at);
      if (now > expiresAt) {
        return { success: false, error: 'Verification code has expired' };
      }

      // Check max attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        return { success: false, error: 'Too many failed attempts. Please request a new code' };
      }

      // Increment attempts
      await supabase
        .from('otp_codes')
        .update({ attempts: otpData.attempts + 1 })
        .eq('id', otpData.id);

      // Verify code
      if (otpData.code !== request.code) {
        const attemptsLeft = this.MAX_ATTEMPTS - (otpData.attempts + 1);
        return { 
          success: false, 
          error: `Invalid verification code. ${attemptsLeft} attempts remaining` 
        };
      }

      // Mark as verified
      await supabase
        .from('otp_codes')
        .update({ 
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpData.id);

      // Clean up old OTP codes for this email/purpose
      await this.cleanupOldOTPs(request.email, request.purpose);

      logger.info('OTP verified successfully', { 
        email: request.email, 
        purpose: request.purpose 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to verify OTP');
      return { success: false, error: 'Failed to verify code' };
    }
  }

  /**
   * Check if user has a valid verified OTP
   */
  static async hasValidVerification(email: string, purpose: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('verified_at')
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('verified', true)
        .order('verified_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if verification is still valid (within 24 hours)
      const verifiedAt = new Date(data.verified_at);
      const now = new Date();
      const hoursSinceVerification = (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60);

      return hoursSinceVerification < 24;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check rate limit for sending OTP
   */
  private static async checkRateLimit(email: string, purpose: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('created_at')
        .eq('email', email)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { allowed: true };
      }

      const lastSent = new Date(data.created_at);
      const now = new Date();
      const minutesSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60);

      if (minutesSinceLastSent < this.RATE_LIMIT_MINUTES) {
        const retryAfter = Math.ceil(this.RATE_LIMIT_MINUTES - minutesSinceLastSent);
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: true };
    }
  }

  /**
   * Clean up old OTP codes
   */
  private static async cleanupOldOTPs(email: string, purpose: string): Promise<void> {
    try {
      // Delete old unverified codes
      await supabase
        .from('otp_codes')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('verified', false);

      // Delete old verified codes (older than 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await supabase
        .from('otp_codes')
        .delete()
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('verified', true)
        .lt('verified_at', yesterday.toISOString());
    } catch (error) {
      logger.error('Failed to cleanup old OTPs');
    }
  }

  /**
   * Clean up expired OTP codes (scheduled task)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      const now = new Date();
      const { error } = await supabase
        .from('otp_codes')
        .delete()
        .lt('expires_at', now.toISOString());

      if (error) {
        logger.error('Failed to cleanup expired OTPs');
      } else {
        logger.info('Cleaned up expired OTPs');
      }
    } catch (error) {
      logger.error('Failed to cleanup expired OTPs');
    }
  }

  /**
   * Get OTP statistics for analytics
   */
  static async getOTPStats(email: string): Promise<{
    totalSent: number;
    totalVerified: number;
    lastSent?: Date;
    lastVerified?: Date;
  }> {
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('verified, created_at, verified_at')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        return { totalSent: 0, totalVerified: 0 };
      }

      const totalSent = data.length;
      const totalVerified = data.filter(otp => otp.verified).length;
      const lastSent = data.length > 0 ? new Date(data[0].created_at) : undefined;
      const lastVerified = data.find(otp => otp.verified_at)?.verified_at 
        ? new Date(data.find(otp => otp.verified_at)!.verified_at) 
        : undefined;

      return { totalSent, totalVerified, lastSent, lastVerified };
    } catch (error) {
      return { totalSent: 0, totalVerified: 0 };
    }
  }

  /**
   * Resend OTP (with rate limiting)
   */
  static async resendOTP(request: SendOTPRequest): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
    // Same as sendOTP but with additional logging
    const result = await this.sendOTP(request);
    
    if (result.success) {
      logger.info('OTP resent successfully', { 
        email: request.email, 
        purpose: request.purpose 
      });
    }
    
    return result;
  }
} 