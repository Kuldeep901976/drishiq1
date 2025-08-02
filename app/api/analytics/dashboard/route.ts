import { AnalyticsService } from '@/lib/analytics-service';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const utmSource = searchParams.get('utmSource');
    const reportType = searchParams.get('type') || 'overview';

    // Check admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (reportType) {
      case 'overview':
        const dashboardData = await AnalyticsService.getDashboardData(startDate, endDate, utmSource || undefined);
        return NextResponse.json({ data: dashboardData });

      case 'top-pages':
        const topPages = await AnalyticsService.getTopPages(20);
        return NextResponse.json({ data: topPages });

      case 'conversion-funnel':
        const funnelName = searchParams.get('funnel') || 'Invitation Request Funnel';
        const funnelData = await AnalyticsService.getConversionFunnelData(funnelName);
        return NextResponse.json({ data: funnelData });

      case 'utm-performance':
        const { data: utmData, error: utmError } = await supabase
          .from('user_sessions')
          .select('utm_source, utm_medium, utm_campaign, duration_seconds, page_views, is_conversion')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .not('utm_source', 'is', null);

        if (utmError) {
          throw utmError;
        }

        // Process data in JavaScript
        const utmStats = utmData?.reduce((acc: any, session: any) => {
          const key = `${session.utm_source}-${session.utm_medium}-${session.utm_campaign}`;
          if (!acc[key]) {
            acc[key] = {
              utm_source: session.utm_source,
              utm_medium: session.utm_medium,
              utm_campaign: session.utm_campaign,
              sessions: 0,
              total_duration: 0,
              total_page_views: 0,
              conversions: 0
            };
          }
          acc[key].sessions += 1;
          acc[key].total_duration += session.duration_seconds || 0;
          acc[key].total_page_views += session.page_views || 0;
          if (session.is_conversion) acc[key].conversions += 1;
          return acc;
        }, {});

        return NextResponse.json({ data: Object.values(utmStats || {}) });

      case 'user-journey':
        const { data: journeyData, error: journeyError } = await supabase
          .from('user_journeys')
          .select('journey_stage, touchpoint, time_spent_seconds')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (journeyError) {
          throw journeyError;
        }

        // Process data in JavaScript
        const journeyStats = journeyData?.reduce((acc: any, journey: any) => {
          const key = `${journey.journey_stage}-${journey.touchpoint}`;
          if (!acc[key]) {
            acc[key] = {
              journey_stage: journey.journey_stage,
              touchpoint: journey.touchpoint,
              count: 0,
              total_time: 0
            };
          }
          acc[key].count += 1;
          acc[key].total_time += journey.time_spent_seconds || 0;
          return acc;
        }, {});

        return NextResponse.json({ data: Object.values(journeyStats || {}) });

      case 'attribution':
        const { data: attributionData, error: attributionError } = await supabase
          .from('attribution_models')
          .select('conversion_type, first_touch_source, last_touch_source, conversion_value')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (attributionError) {
          throw attributionError;
        }

        // Process data in JavaScript
        const attributionStats = attributionData?.reduce((acc: any, attr: any) => {
          const key = `${attr.conversion_type}-${attr.first_touch_source}-${attr.last_touch_source}`;
          if (!acc[key]) {
            acc[key] = {
              conversion_type: attr.conversion_type,
              first_touch_source: attr.first_touch_source,
              last_touch_source: attr.last_touch_source,
              conversions: 0,
              total_value: 0
            };
          }
          acc[key].conversions += 1;
          acc[key].total_value += attr.conversion_value || 0;
          return acc;
        }, {});

        return NextResponse.json({ data: Object.values(attributionStats || {}) });

      case 'real-time':
        const { data: realtimeData, error: realtimeError } = await supabase
          .from('user_sessions')
          .select('session_id, device_type, browser, country, utm_source, utm_medium, utm_campaign, page_views, created_at, last_activity')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .is('ended_at', null)
          .order('last_activity', { ascending: false })
          .limit(100);

        if (realtimeError) {
          throw realtimeError;
        }

        return NextResponse.json({ data: realtimeData });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Analytics dashboard API error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 