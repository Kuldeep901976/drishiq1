import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { supabase } from './supabase';

export interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  pageUrl?: string;
  pageTitle?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  properties?: Record<string, any>;
  processingTimeMs?: number;
  errorOccurred?: boolean;
  errorMessage?: string;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  country?: string;
  city?: string;
  utmParameters?: UTMParameters;
  referrer?: string;
  landingPage?: string;
}

export interface ConversionData {
  conversionType: string;
  conversionValue?: number;
  metadata?: Record<string, any>;
}

export interface JourneyStep {
  stage: 'awareness' | 'interest' | 'consideration' | 'conversion' | 'retention';
  touchpoint: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl?: string;
  actionTaken?: string;
  timeSpentSeconds?: number;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  private static currentSession: UserSession | null = null;
  private static sessionEvents: AnalyticsEvent[] = [];
  private static sessionStartTime: number = Date.now();

  /**
   * Initialize analytics session
   */
  static async initializeSession(data: Partial<UserSession> = {}): Promise<string> {
    try {
      const sessionId = uuidv4();
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      const landingPage = typeof window !== 'undefined' ? window.location.href : '';
      
      // Parse UTM parameters from URL
      const utmParameters = this.parseUTMParameters();
      
      // Detect device info
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // Store session data
      this.currentSession = {
        sessionId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.operatingSystem,
        country: data.country,
        city: data.city,
        utmParameters,
        referrer,
        landingPage,
        ...data
      };

      // Insert session into database
      const { error } = await supabase
        .from('user_sessions')
        .insert([{
          session_id: sessionId,
          user_id: data.userId,
          ip_address: data.ipAddress,
          user_agent: userAgent,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          operating_system: deviceInfo.operatingSystem,
          country: data.country,
          city: data.city,
          utm_source: utmParameters.utm_source,
          utm_medium: utmParameters.utm_medium,
          utm_campaign: utmParameters.utm_campaign,
          utm_term: utmParameters.utm_term,
          utm_content: utmParameters.utm_content,
          referrer,
          landing_page: landingPage,
          page_views: 0,
          is_conversion: false
        }]);

      if (error) {
        logger.error('Failed to initialize analytics session');
        throw error;
      }

      this.sessionStartTime = Date.now();
      logger.info('Analytics session initialized');
      return sessionId;
    } catch (error) {
      logger.error('Error initializing analytics session');
      throw error;
    }
  }

  /**
   * Track an analytics event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      const eventData = {
        session_id: this.currentSession!.sessionId,
        user_id: this.currentSession!.userId,
        event_type: event.eventType,
        event_name: event.eventName,
        page_url: event.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        page_title: event.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
        element_id: event.elementId,
        element_class: event.elementClass,
        element_text: event.elementText,
        properties: event.properties,
        processing_time_ms: event.processingTimeMs,
        error_occurred: event.errorOccurred || false,
        error_message: event.errorMessage
      };

      // Insert event into database
      const { error } = await supabase
        .from('analytics_events')
        .insert([eventData]);

      if (error) {
        logger.error('Failed to track analytics event');
        throw error;
      }

      // Store in session cache
      this.sessionEvents.push(event);

      // Update session page views if it's a page view
      if (event.eventType === 'page_view') {
        await this.updateSessionPageViews();
      }

      logger.info('Analytics event tracked successfully');
    } catch (error) {
      logger.error('Error tracking analytics event');
      // Don't throw error to avoid breaking user experience
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(pageUrl?: string, pageTitle?: string): Promise<void> {
    await this.trackEvent({
      eventType: 'page_view',
      eventName: 'page_view',
      pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      pageTitle: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      properties: {
        timestamp: new Date().toISOString(),
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      }
    });
  }

  /**
   * Track user interaction
   */
  static async trackInteraction(
    elementId: string,
    interactionType: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'interaction',
      eventName: interactionType,
      elementId,
      properties: {
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  }

  /**
   * Track conversion
   */
  static async trackConversion(data: ConversionData): Promise<void> {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      // Track conversion event
      await this.trackEvent({
        eventType: 'conversion',
        eventName: data.conversionType,
        properties: {
          conversion_value: data.conversionValue,
          ...data.metadata
        }
      });

      // Update session conversion status
      await supabase
        .from('user_sessions')
        .update({
          is_conversion: true,
          conversion_type: data.conversionType,
          conversion_value: data.conversionValue
        })
        .eq('session_id', this.currentSession!.sessionId);

      // Track attribution
      await this.trackAttribution(data);

      logger.info('Conversion tracked successfully');
    } catch (error) {
      logger.error('Error tracking conversion');
      throw error;
    }
  }

  /**
   * Track user journey step
   */
  static async trackJourneyStep(step: JourneyStep): Promise<void> {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      const { error } = await supabase
        .from('user_journeys')
        .insert([{
          user_id: this.currentSession!.userId,
          session_id: this.currentSession!.sessionId,
          journey_stage: step.stage,
          touchpoint: step.touchpoint,
          utm_source: step.utmSource || this.currentSession!.utmParameters?.utm_source,
          utm_medium: step.utmMedium || this.currentSession!.utmParameters?.utm_medium,
          utm_campaign: step.utmCampaign || this.currentSession!.utmParameters?.utm_campaign,
          page_url: step.pageUrl,
          action_taken: step.actionTaken,
          time_spent_seconds: step.timeSpentSeconds,
          metadata: step.metadata
        }]);

      if (error) {
        logger.error('Failed to track journey step');
        throw error;
      }

      logger.info('Journey step tracked successfully');
    } catch (error) {
      logger.error('Error tracking journey step');
      throw error;
    }
  }

  /**
   * Track attribution
   */
  static async trackAttribution(conversionData: ConversionData): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      // Get first and last touch attribution
      const firstTouch = await this.getFirstTouchAttribution(this.currentSession!.userId);
      const lastTouch = this.getLastTouchAttribution();

      const { error } = await supabase
        .from('attribution_models')
        .insert([{
          user_id: this.currentSession!.userId,
          conversion_type: conversionData.conversionType,
          conversion_value: conversionData.conversionValue,
          first_touch_source: firstTouch.source,
          first_touch_medium: firstTouch.medium,
          first_touch_campaign: firstTouch.campaign,
          first_touch_timestamp: firstTouch.timestamp,
          last_touch_source: lastTouch.source,
          last_touch_medium: lastTouch.medium,
          last_touch_campaign: lastTouch.campaign,
          last_touch_timestamp: lastTouch.timestamp,
          attribution_model: 'last_touch',
          attribution_weight: 1.0
        }]);

      if (error) {
        logger.error('Failed to track attribution');
        throw error;
      }

      logger.info('Attribution tracked successfully');
    } catch (error) {
      logger.error('Error tracking attribution');
      throw error;
    }
  }

  /**
   * End current session
   */
  static async endSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          page_views: this.sessionEvents.filter(e => e.eventType === 'page_view').length
        })
        .eq('session_id', this.currentSession.sessionId);

      this.currentSession = null;
      this.sessionEvents = [];
      
      logger.info('Analytics session ended');
    } catch (error) {
      logger.error('Error ending analytics session');
    }
  }

  /**
   * Get analytics dashboard data
   */
  static async getDashboardData(
    startDate: string,
    endDate: string,
    utmSource?: string
  ): Promise<any> {
    try {
      let query = supabase
        .from('analytics_dashboard')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (utmSource) {
        query = query.eq('utm_source', utmSource);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting dashboard data');
      throw error;
    }
  }

  /**
   * Get top pages
   */
  static async getTopPages(limit: number = 10): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('top_pages')
        .select('*')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting top pages');
      throw error;
    }
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnelData(funnelName: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('conversion_funnel_analysis')
        .select('*')
        .eq('funnel_name', funnelName)
        .order('step_order');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting conversion funnel data');
      throw error;
    }
  }

  /**
   * Parse UTM parameters from URL
   */
  private static parseUTMParameters(): UTMParameters {
    if (typeof window === 'undefined') {
      return {};
    }

    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
      utm_content: urlParams.get('utm_content') || undefined
    };
  }

  /**
   * Parse user agent for device info
   */
  private static parseUserAgent(userAgent: string): {
    deviceType: string;
    browser: string;
    operatingSystem: string;
  } {
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 
                     /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop';

    const browser = /Chrome/.test(userAgent) ? 'Chrome' :
                   /Firefox/.test(userAgent) ? 'Firefox' :
                   /Safari/.test(userAgent) ? 'Safari' :
                   /Edge/.test(userAgent) ? 'Edge' : 'Unknown';

    const operatingSystem = /Windows/.test(userAgent) ? 'Windows' :
                           /Mac/.test(userAgent) ? 'macOS' :
                           /Linux/.test(userAgent) ? 'Linux' :
                           /Android/.test(userAgent) ? 'Android' :
                           /iOS/.test(userAgent) ? 'iOS' : 'Unknown';

    return { deviceType, browser, operatingSystem };
  }

  /**
   * Update session page views
   */
  private static async updateSessionPageViews(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const pageViews = this.sessionEvents.filter(e => e.eventType === 'page_view').length;
    
    await supabase
      .from('user_sessions')
      .update({ 
        page_views: pageViews,
        last_activity: new Date().toISOString()
      })
      .eq('session_id', this.currentSession.sessionId);
  }

  /**
   * Get first touch attribution
   */
  private static async getFirstTouchAttribution(userId?: string): Promise<any> {
    if (!userId) {
      return this.getLastTouchAttribution();
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('utm_source, utm_medium, utm_campaign, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return this.getLastTouchAttribution();
      }

      return {
        source: data.utm_source,
        medium: data.utm_medium,
        campaign: data.utm_campaign,
        timestamp: data.created_at
      };
    } catch (error) {
      return this.getLastTouchAttribution();
    }
  }

  /**
   * Get last touch attribution
   */
  private static getLastTouchAttribution(): any {
    if (!this.currentSession) {
      return {
        source: 'direct',
        medium: 'none',
        campaign: 'direct',
        timestamp: new Date().toISOString()
      };
    }

    return {
      source: this.currentSession.utmParameters?.utm_source || 'direct',
      medium: this.currentSession.utmParameters?.utm_medium || 'none',
      campaign: this.currentSession.utmParameters?.utm_campaign || 'direct',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Initialize A/B testing
   */
  static async initializeABTest(testName: string, userId?: string): Promise<string> {
    try {
      if (!this.currentSession) {
        await this.initializeSession();
      }

      // Get test configuration
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_name', testName)
        .eq('status', 'running')
        .single();

      if (testError || !test) {
        return 'control'; // Default variant
      }

      // Check if user already has assignment
      const { data: existingAssignment } = await supabase
        .from('ab_test_assignments')
        .select('variant_name')
        .eq('test_id', test.id)
        .eq('user_id', userId)
        .single();

      if (existingAssignment) {
        return existingAssignment.variant_name;
      }

      // Assign variant based on weights
      const variants = test.variants as Array<{ name: string; weight: number }>;
      const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      let assignedVariant = 'control';
      
      for (const variant of variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          assignedVariant = variant.name;
          break;
        }
      }

      // Store assignment
      await supabase
        .from('ab_test_assignments')
        .insert([{
          test_id: test.id,
          user_id: userId,
          session_id: this.currentSession!.sessionId,
          variant_name: assignedVariant
        }]);

      return assignedVariant;
    } catch (error) {
      logger.error('Error initializing A/B test');
      return 'control';
    }
  }

  /**
   * Track A/B test conversion
   */
  static async trackABTestConversion(
    testName: string,
    userId?: string,
    conversionValue?: number
  ): Promise<void> {
    try {
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_name', testName)
        .single();

      if (testError || !test) {
        return;
      }

      await supabase
        .from('ab_test_assignments')
        .update({
          converted: true,
          conversion_value: conversionValue
        })
        .eq('test_id', test.id)
        .eq('user_id', userId);

      logger.info('A/B test conversion tracked');
    } catch (error) {
      logger.error('Error tracking A/B test conversion');
    }
  }
} 