import { logger } from './logger';
import { supabase } from './supabase';

export interface PricingPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  plan_description: string;
  base_price_usd: number;
  billing_cycle: string;
  credits_included: number;
  features: string[];
  max_sessions_per_month: number;
  max_users: number;
  is_active: boolean;
}

export interface CreditBalance {
  user_id: string;
  total_credits: number;
  available_credits: number;
  reserved_credits: number;
  last_updated: Date;
}

export class PaymentService {
  /**
   * Get all pricing plans
   */
  static async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get pricing plans');
      throw error;
    }
  }

  /**
   * Get user's credit balance
   */
  static async getCreditBalance(userId: string): Promise<CreditBalance | null> {
    try {
      const { data, error } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error('Failed to get credit balance');
      throw error;
    }
  }

  /**
   * Add credits to user account
   */
  static async addCredits(
    userId: string,
    amount: number,
    description: string,
    validityDays: number = 365
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        amount: amount,
        description: description,
        expires_days: validityDays
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to add credits');
      throw error;
    }
  }

  /**
   * Deduct credits from user account
   */
  static async deductCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('deduct_credits', {
        user_uuid: userId,
        amount: amount,
        description: description
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to deduct credits');
      throw error;
    }
  }

  /**
   * Detect user's region based on IP or locale
   */
  static async detectUserRegion(request?: Request): Promise<string> {
    try {
      if (!request) return 'GLOBAL';

      // Try to get region from headers
      const countryHeader = request.headers.get('cf-ipcountry') || 
                           request.headers.get('x-forwarded-for') ||
                           request.headers.get('x-country-code');

      if (countryHeader) {
        // Map country codes to regions
        const regionMap: Record<string, string> = {
          'US': 'US',
          'CA': 'CA',
          'GB': 'GB',
          'DE': 'EU', 'FR': 'EU', 'IT': 'EU', 'ES': 'EU', 'NL': 'EU',
          'IN': 'IN',
          'AU': 'AU',
          'SG': 'SG'
        };

        return regionMap[countryHeader.toUpperCase()] || 'GLOBAL';
      }

      return 'GLOBAL';
    } catch (error) {
      logger.error('Failed to detect user region');
      return 'GLOBAL';
    }
  }

  /**
   * Get regional pricing for a specific region
   */
  static async getRegionalPricing(regionCode: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('regional_pricing')
        .select(`
          *,
          pricing_plans!inner(plan_code, plan_name, plan_description, billing_cycle, credits_included, features, max_sessions_per_month, max_users),
          pricing_regions!inner(region_code, region_name, currency_code, currency_symbol)
        `)
        .eq('pricing_regions.region_code', regionCode)
        .eq('pricing_regions.is_active', true)
        .eq('pricing_plans.is_active', true)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get regional pricing');
      throw error;
    }
  }

  /**
   * Get credit packages with regional pricing
   */
  static async getCreditPackages(regionCode: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('regional_credit_pricing')
        .select(`
          *,
          credit_packages!inner(*),
          pricing_regions!inner(region_code, region_name, currency_code, currency_symbol)
        `)
        .eq('pricing_regions.region_code', regionCode)
        .eq('pricing_regions.is_active', true)
        .eq('credit_packages.is_active', true)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        ...item.credit_packages,
        regional_price: item.price,
        currency_code: item.currency_code
      })) || [];
    } catch (error) {
      logger.error('Failed to get credit packages');
      throw error;
    }
  }

  /**
   * Get all pricing regions
   */
  static async getPricingRegions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pricing_regions')
        .select('*')
        .eq('is_active', true)
        .order('region_name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get pricing regions');
      throw error;
    }
  }

  /**
   * Reserve credits for a session
   */
  static async reserveCredits(
    userId: string,
    sessionId: string,
    amount: number,
    sessionType: string = 'standard'
  ): Promise<boolean> {
    try {
      // Check if user has enough credits
      const balance = await this.getCreditBalance(userId);
      if (!balance || balance.available_credits < amount) {
        return false;
      }

      // Reserve credits
      const { error: reserveError } = await supabase
        .from('credit_balances')
        .update({
          available_credits: balance.available_credits - amount,
          reserved_credits: balance.reserved_credits + amount,
          last_updated: new Date()
        })
        .eq('user_id', userId);

      if (reserveError) {
        throw reserveError;
      }

      // Record session credit reservation
      const { error: sessionError } = await supabase
        .from('session_credits')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          credits_reserved: amount,
          session_type: sessionType,
          session_started_at: new Date()
        }]);

      if (sessionError) {
        throw sessionError;
      }

      return true;
    } catch (error) {
      logger.error('Failed to reserve credits');
      throw error;
    }
  }

  /**
   * Complete session and deduct actual credits used
   */
  static async completeSession(
    userId: string,
    sessionId: string,
    creditsUsed: number
  ): Promise<boolean> {
    try {
      // Get session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('session_credits')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Session not found');
      }

      const reservedCredits = sessionData.credits_reserved;
      const refundAmount = Math.max(0, reservedCredits - creditsUsed);

      // Update session record
      const { error: updateSessionError } = await supabase
        .from('session_credits')
        .update({
          credits_used: creditsUsed,
          credits_refunded: refundAmount,
          session_ended_at: new Date(),
          session_duration_minutes: Math.floor((new Date().getTime() - new Date(sessionData.session_started_at).getTime()) / 60000)
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (updateSessionError) {
        throw updateSessionError;
      }

      // Get current balance
      const balance = await this.getCreditBalance(userId);
      if (!balance) {
        throw new Error('User balance not found');
      }

      // Update credit balance
      const { error: balanceError } = await supabase
        .from('credit_balances')
        .update({
          total_credits: balance.total_credits - creditsUsed,
          available_credits: balance.available_credits + refundAmount,
          reserved_credits: balance.reserved_credits - reservedCredits,
          last_updated: new Date()
        })
        .eq('user_id', userId);

      if (balanceError) {
        throw balanceError;
      }

      // Record credit transaction for actual usage
      if (creditsUsed > 0) {
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert([{
            user_id: userId,
            transaction_type: 'deduction',
            amount: -creditsUsed,
            balance_after: balance.total_credits - creditsUsed,
            description: `Session usage: ${sessionId}`,
            session_id: sessionId
          }]);

        if (transactionError) {
          throw transactionError;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to complete session');
      throw error;
    }
  }
} 