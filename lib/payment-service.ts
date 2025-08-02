import Stripe from 'stripe';
import { logger } from './logger';
import { supabase } from './supabase';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
}) : null;

export interface PricingRegion {
  id: string;
  region_code: string;
  region_name: string;
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  price_multiplier: number;
  is_active: boolean;
}

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

export interface RegionalPricing {
  id: string;
  plan_id: string;
  region_id: string;
  price: number;
  currency_code: string;
  stripe_price_id?: string;
  is_active: boolean;
}

export interface CreditPackage {
  id: string;
  package_code: string;
  package_name: string;
  credits_amount: number;
  base_price_usd: number;
  bonus_credits: number;
  validity_days: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  region_id: string;
  status: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  trial_end?: Date;
}

export interface CreditBalance {
  user_id: string;
  total_credits: number;
  available_credits: number;
  reserved_credits: number;
  last_updated: Date;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency_code: string;
  status: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class PaymentService {
  /**
   * Get all pricing regions
   */
  static async getPricingRegions(): Promise<PricingRegion[]> {
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
   * Get pricing plans
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
   * Get regional pricing for a specific region
   */
  static async getRegionalPricing(regionCode: string): Promise<RegionalPricing[]> {
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
  static async getCreditPackages(regionCode: string): Promise<CreditPackage[]> {
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
   * Detect user's region based on IP or locale
   */
  static async detectUserRegion(request: Request): Promise<string> {
    try {
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

      // Fallback to Accept-Language header
      const acceptLanguage = request.headers.get('accept-language');
      if (acceptLanguage) {
        const locale = acceptLanguage.split(',')[0].toLowerCase();
        if (locale.includes('en-us')) return 'US';
        if (locale.includes('en-gb')) return 'GB';
        if (locale.includes('en-ca')) return 'CA';
        if (locale.includes('en-au')) return 'AU';
        if (locale.includes('hi') || locale.includes('en-in')) return 'IN';
        if (locale.includes('de') || locale.includes('fr') || locale.includes('it')) return 'EU';
      }

      return 'GLOBAL';
    } catch (error) {
      logger.error('Failed to detect user region');
      return 'GLOBAL';
    }
  }

  /**
   * Create Stripe customer
   */
  static async createStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: userId
        }
      });

      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer');
      throw error;
    }
  }

  /**
   * Create subscription
   */
  static async createSubscription(
    userId: string,
    planId: string,
    regionCode: string,
    paymentMethodId: string,
    customerId?: string
  ): Promise<UserSubscription> {
    try {
      // Get regional pricing
      const { data: pricingData, error: pricingError } = await supabase
        .from('regional_pricing')
        .select(`
          *,
          pricing_plans!inner(*),
          pricing_regions!inner(*)
        `)
        .eq('plan_id', planId)
        .eq('pricing_regions.region_code', regionCode)
        .single();

      if (pricingError || !pricingData) {
        throw new Error('Pricing not found');
      }

      // Create Stripe customer if not exists
      let stripeCustomerId = customerId;
      if (!stripeCustomerId) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (userData) {
          stripeCustomerId = await this.createStripeCustomer(userId, userData.email, userData.full_name);
        }
      }

      // Create Stripe subscription
      if (!stripe) {
        throw new Error('Stripe is not configured');
      }
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId!,
        items: [
          {
            price: pricingData.stripe_price_id || 'price_default'
          }
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          plan_id: planId,
          region_code: regionCode
        }
      });

      // Save subscription to database
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          plan_id: planId,
          region_id: pricingData.pricing_regions.id,
          status: stripeSubscription.status,
          stripe_subscription_id: stripeSubscription.id,
          stripe_customer_id: stripeCustomerId,
          current_period_start: new Date((stripeSubscription as any).current_period_start * 1000),
          current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
          trial_end: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000) : null
        }])
        .select()
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Add initial credits
      await this.addCredits(userId, pricingData.pricing_plans.credits_included, 'Initial subscription credits');

      return subscriptionData;
    } catch (error) {
      logger.error('Failed to create subscription');
      throw error;
    }
  }

  /**
   * Purchase credits
   */
  static async purchaseCredits(
    userId: string,
    packageId: string,
    regionCode: string,
    paymentMethodId: string
  ): Promise<PaymentTransaction> {
    try {
      // Get package pricing
      const { data: packageData, error: packageError } = await supabase
        .from('regional_credit_pricing')
        .select(`
          *,
          credit_packages!inner(*),
          pricing_regions!inner(*)
        `)
        .eq('package_id', packageId)
        .eq('pricing_regions.region_code', regionCode)
        .single();

      if (packageError || !packageData) {
        throw new Error('Package not found');
      }

      // Get or create Stripe customer
      let stripeCustomerId: string;
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (existingSubscription?.stripe_customer_id) {
        stripeCustomerId = existingSubscription.stripe_customer_id;
      } else {
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (userData) {
          stripeCustomerId = await this.createStripeCustomer(userId, userData.email, userData.full_name);
        } else {
          throw new Error('User not found');
        }
      }

      // Create payment intent
      if (!stripe) {
        throw new Error('Stripe is not configured');
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(packageData.price * 100), // Convert to cents
        currency: packageData.currency_code.toLowerCase(),
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          user_id: userId,
          package_id: packageId,
          credits_amount: packageData.credit_packages.credits_amount.toString(),
          bonus_credits: packageData.credit_packages.bonus_credits.toString()
        }
      });

      // Save payment transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([{
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: packageData.price,
          currency_code: packageData.currency_code,
          status: paymentIntent.status,
          payment_method: 'card',
          description: `Credit purchase: ${packageData.credit_packages.package_name}`,
          metadata: {
            package_id: packageId,
            credits_amount: packageData.credit_packages.credits_amount,
            bonus_credits: packageData.credit_packages.bonus_credits
          }
        }])
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // If payment succeeded, add credits
      if (paymentIntent.status === 'succeeded') {
        const totalCredits = packageData.credit_packages.credits_amount + packageData.credit_packages.bonus_credits;
        await this.addCredits(
          userId, 
          totalCredits, 
          `Credit purchase: ${packageData.credit_packages.package_name}`,
          packageData.credit_packages.validity_days
        );
      }

      return transactionData;
    } catch (error) {
      logger.error('Failed to purchase credits');
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

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_plans(*),
          pricing_regions(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error('Failed to get user subscription');
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    try {
      // Get subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (subscriptionError || !subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel in Stripe
      if (subscription.stripe_subscription_id) {
        if (!stripe) {
          throw new Error('Stripe is not configured');
        }
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date()
        })
        .eq('id', subscriptionId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      logger.error('Failed to cancel subscription');
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks
   */
  static async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as any);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as any);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Failed to handle Stripe webhook');
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment transaction
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (updateError) {
        throw updateError;
      }

      // If it's a credit purchase, add credits
      if (paymentIntent.metadata.package_id) {
        const userId = paymentIntent.metadata.user_id;
        const creditsAmount = parseInt(paymentIntent.metadata.credits_amount);
        const bonusCredits = parseInt(paymentIntent.metadata.bonus_credits);
        const totalCredits = creditsAmount + bonusCredits;

        await this.addCredits(userId, totalCredits, 'Credit purchase completed');
      }
    } catch (error) {
      logger.error('Failed to handle payment succeeded');
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to handle payment failed');
      throw error;
    }
  }

  /**
   * Handle invoice payment succeeded
   */
  private static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      if (invoice.subscription) {
        // Update subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', invoice.subscription);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Failed to handle invoice payment succeeded');
      throw error;
    }
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to handle subscription updated');
      throw error;
    }
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to handle subscription deleted');
      throw error;
    }
  }
} 