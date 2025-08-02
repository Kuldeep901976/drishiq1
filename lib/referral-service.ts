
import { Database } from '../supabase.types';
import { logger } from './logger';

import { supabase } from './supabase';

export interface ReferralCode {
  id: string;
  code: string;
  user_id: string;
  type: 'user' | 'affiliate';
  is_active: boolean;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'confirmed' | 'rewarded' | 'cancelled';
  reward_amount: number;
  reward_currency: string;
  reward_type: 'credits' | 'cash' | 'subscription';
  conversion_event?: string;
  converted_at?: string;
  rewarded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  program_id: string;
  affiliate_code: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  commission_rate?: number;
  total_referrals: number;
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
  payment_method?: string;
  payment_details?: any;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  description?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_amount?: number;
  cookie_duration: number;
  minimum_payout: number;
  is_active: boolean;
  terms_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionCalculation {
  amount: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
}

export class ReferralService {
  // Generate referral code
  static async generateReferralCode(
    userId: string,
    type: 'user' | 'affiliate' = 'user',
    maxUses?: number,
    expiresAt?: Date
  ): Promise<ReferralCode> {
    try {
      // Generate unique code
      const code = this.generateUniqueCode(type);
      
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          code,
          user_id: userId,
          type,
          max_uses: maxUses || null,
          expires_at: expiresAt?.toISOString() || null,
          is_active: true,
          current_uses: 0
        })
        .select()
        .single();

      if (error) {
        logger.error('Error generating referral code', error, { userId, type });
        throw error;
      }

      logger.info('Referral code generated', { userId, code, type });
      return data;
    } catch (error) {
      logger.error('Failed to generate referral code', error, { userId, type });
      throw error;
    }
  }

  // Validate referral code
  static async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referralCode?: ReferralCode;
    reason?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, reason: 'Code not found or inactive' };
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, reason: 'Code expired' };
      }

      // Check usage limit
      if (data.max_uses && data.current_uses >= data.max_uses) {
        return { valid: false, reason: 'Code usage limit exceeded' };
      }

      return { valid: true, referralCode: data };
    } catch (error) {
      logger.error('Error validating referral code', error, { code });
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Track referral
  static async trackReferral(
    referralCode: string,
    refereeId: string,
    conversionEvent: string = 'signup'
  ): Promise<Referral> {
    try {
      // First validate the code
      const validation = await this.validateReferralCode(referralCode);
      if (!validation.valid || !validation.referralCode) {
        throw new Error(`Invalid referral code: ${validation.reason}`);
      }

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('referee_id', refereeId)
        .single();

      if (existingReferral) {
        logger.info('Referral already exists', { referralCode, refereeId });
        return existingReferral;
      }

      // Create referral
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: validation.referralCode.user_id,
          referee_id: refereeId,
          referral_code: referralCode,
          status: 'pending',
          reward_amount: 0,
          reward_currency: 'USD',
          reward_type: 'credits',
          conversion_event: conversionEvent
        })
        .select()
        .single();

      if (error) {
        logger.error('Error tracking referral', error, { referralCode, refereeId });
        throw error;
      }

      logger.info('Referral tracked', { referralCode, refereeId, conversionEvent });
      return data;
    } catch (error) {
      logger.error('Failed to track referral', error, { referralCode, refereeId });
      throw error;
    }
  }

  // Confirm referral and calculate rewards
  static async confirmReferral(
    referralId: string,
    rewardAmount: number = 10, // Default 10 credits
    rewardType: 'credits' | 'cash' | 'subscription' = 'credits'
  ): Promise<Referral> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .update({
          status: 'confirmed',
          reward_amount: rewardAmount,
          reward_type: rewardType,
          converted_at: new Date().toISOString()
        })
        .eq('id', referralId)
        .select()
        .single();

      if (error) {
        logger.error('Error confirming referral', error, { referralId });
        throw error;
      }

      // Create referral reward
      await this.createReferralReward(referralId, data.referrer_id, rewardAmount, rewardType);

      logger.info('Referral confirmed', { referralId, rewardAmount, rewardType });
      return data;
    } catch (error) {
      logger.error('Failed to confirm referral', error, { referralId });
      throw error;
    }
  }

  // Create referral reward
  static async createReferralReward(
    referralId: string,
    userId: string,
    amount: number,
    type: 'credits' | 'cash' | 'subscription'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('referral_rewards')
        .insert({
          referral_id: referralId,
          user_id: userId,
          reward_type: type,
          reward_amount: amount,
          reward_currency: 'USD',
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) {
        logger.error('Error creating referral reward', error, { referralId, userId });
        throw error;
      }

      logger.info('Referral reward created', { referralId, userId, amount, type });
    } catch (error) {
      logger.error('Failed to create referral reward', error, { referralId, userId });
      throw error;
    }
  }

  // Apply for affiliate program
  static async applyForAffiliateProgram(
    userId: string,
    programId: string,
    paymentMethod?: string,
    paymentDetails?: any
  ): Promise<Affiliate> {
    try {
      // Generate unique affiliate code
      const affiliateCode = this.generateUniqueCode('affiliate');

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          program_id: programId,
          affiliate_code: affiliateCode,
          status: 'pending',
          total_referrals: 0,
          total_earnings: 0,
          paid_earnings: 0,
          pending_earnings: 0,
          payment_method: paymentMethod || null,
          payment_details: paymentDetails || null
        })
        .select()
        .single();

      if (error) {
        logger.error('Error applying for affiliate program', error, { userId, programId });
        throw error;
      }

      logger.info('Affiliate application submitted', { userId, programId, affiliateCode });
      return data;
    } catch (error) {
      logger.error('Failed to apply for affiliate program', error, { userId, programId });
      throw error;
    }
  }

  // Approve affiliate
  static async approveAffiliate(affiliateId: string): Promise<Affiliate> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', affiliateId)
        .select()
        .single();

      if (error) {
        logger.error('Error approving affiliate', error, { affiliateId });
        throw error;
      }

      // Generate referral code for affiliate
      await this.generateReferralCode(data.user_id, 'affiliate');

      logger.info('Affiliate approved', { affiliateId });
      return data;
    } catch (error) {
      logger.error('Failed to approve affiliate', error, { affiliateId });
      throw error;
    }
  }

  // Calculate affiliate commission
  static async calculateCommission(
    affiliateId: string,
    transactionAmount: number,
    currency: string = 'USD'
  ): Promise<CommissionCalculation> {
    try {
      // Get affiliate details
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select(`
          *,
          affiliate_programs (*)
        `)
        .eq('id', affiliateId)
        .single();

      if (affiliateError || !affiliate) {
        throw new Error('Affiliate not found');
      }

      const program = affiliate.affiliate_programs as any;
      const commissionRate = affiliate.commission_rate || program.commission_rate;

      let commissionAmount = 0;
      if (program.commission_type === 'percentage') {
        commissionAmount = transactionAmount * commissionRate;
      } else if (program.commission_type === 'fixed') {
        commissionAmount = program.fixed_amount || 0;
      }

      return {
        amount: transactionAmount,
        currency,
        commission_rate: commissionRate,
        commission_amount: commissionAmount
      };
    } catch (error) {
      logger.error('Error calculating commission', error, { affiliateId });
      throw error;
    }
  }

  // Record affiliate commission
  static async recordCommission(
    affiliateId: string,
    referralId: string,
    commissionAmount: number,
    currency: string = 'USD',
    transactionId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .insert({
          affiliate_id: affiliateId,
          referral_id: referralId,
          transaction_id: transactionId || null,
          commission_amount: commissionAmount,
          commission_currency: currency,
          status: 'pending'
        });

      if (error) {
        logger.error('Error recording commission', error, { affiliateId, referralId });
        throw error;
      }

      logger.info('Commission recorded', { affiliateId, referralId, commissionAmount });
    } catch (error) {
      logger.error('Failed to record commission', error, { affiliateId, referralId });
      throw error;
    }
  }

  // Get user referral statistics
  static async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    confirmedReferrals: number;
    pendingReferrals: number;
    totalRewards: number;
    referralCodes: ReferralCode[];
  }> {
    try {
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (referralsError) {
        logger.error('Error getting user referral stats', referralsError, { userId });
        throw referralsError;
      }

      const { data: codes, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId);

      if (codesError) {
        logger.error('Error getting referral codes', codesError, { userId });
        throw codesError;
      }

      const totalReferrals = referrals?.length || 0;
      const confirmedReferrals = referrals?.filter(r => r.status === 'confirmed').length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalRewards = referrals?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;

      return {
        totalReferrals,
        confirmedReferrals,
        pendingReferrals,
        totalRewards,
        referralCodes: codes || []
      };
    } catch (error) {
      logger.error('Failed to get user referral stats', error, { userId });
      throw error;
    }
  }

  // Get affiliate statistics
  static async getAffiliateStats(affiliateId: string): Promise<{
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    conversionRate: number;
  }> {
    try {
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (affiliateError) {
        logger.error('Error getting affiliate stats', affiliateError, { affiliateId });
        throw affiliateError;
      }

      const { data: commissions, error: commissionsError } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId);

      if (commissionsError) {
        logger.error('Error getting affiliate commissions', commissionsError, { affiliateId });
        throw commissionsError;
      }

      const totalCommissions = commissions?.length || 0;
      const pendingCommissions = commissions?.filter(c => c.status === 'pending').length || 0;
      const paidCommissions = commissions?.filter(c => c.status === 'paid').length || 0;

      const conversionRate = affiliate.total_referrals > 0 
        ? (totalCommissions / affiliate.total_referrals) * 100 
        : 0;

      return {
        totalCommissions,
        pendingCommissions,
        paidCommissions,
        totalEarnings: affiliate.total_earnings,
        pendingEarnings: affiliate.pending_earnings,
        paidEarnings: affiliate.paid_earnings,
        conversionRate
      };
    } catch (error) {
      logger.error('Failed to get affiliate stats', error, { affiliateId });
      throw error;
    }
  }

  // Get all affiliate programs
  static async getAffiliatePrograms(): Promise<AffiliateProgram[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting affiliate programs', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get affiliate programs', error);
      throw error;
    }
  }

  // Generate unique code
  private static generateUniqueCode(type: 'user' | 'affiliate'): string {
    const prefix = type === 'affiliate' ? 'AFF' : 'REF';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  // Process expired referral codes
  static async processExpiredCodes(): Promise<void> {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true);

      if (error) {
        logger.error('Error processing expired codes', error);
        throw error;
      }

      logger.info('Expired referral codes processed');
    } catch (error) {
      logger.error('Failed to process expired codes', error);
      throw error;
    }
  }

  // Process pending payouts
  static async processPendingPayouts(): Promise<void> {
    try {
      const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select('*')
        .gte('pending_earnings', 50) // Minimum payout threshold
        .eq('status', 'approved');

      if (error) {
        logger.error('Error getting affiliates for payout', error);
        throw error;
      }

      for (const affiliate of affiliates || []) {
        // Create payout record
        const { error: payoutError } = await supabase
          .from('affiliate_payouts')
          .insert({
            affiliate_id: affiliate.id,
            amount: affiliate.pending_earnings,
            currency: 'USD',
            payment_method: affiliate.payment_method || 'bank_transfer',
            status: 'pending'
          });

        if (payoutError) {
          logger.error('Error creating payout', payoutError, { affiliateId: affiliate.id });
          continue;
        }

        logger.info('Payout created for affiliate', { affiliateId: affiliate.id, amount: affiliate.pending_earnings });
      }
    } catch (error) {
      logger.error('Failed to process pending payouts', error);
      throw error;
    }
  }
} 