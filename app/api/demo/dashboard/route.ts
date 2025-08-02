
import { NextRequest, NextResponse } from 'next/server';
import { DemoService } from '../../../../lib/demo-service';
import { logger } from '../../../../lib/logger';



import { supabase } from '../../../../lib/supabase';
export async function GET(request: NextRequest) {
  try {
    // Get user from auth (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    // Check if user is admin (you might want to implement proper role checking)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || undefined;
    const stakeholderType = searchParams.get('stakeholder_type') || undefined;

    // Get demo invitations
    const { invitations, total } = await DemoService.getDemoInvitations(
      limit, 
      offset, 
      status, 
      stakeholderType
    );

    // Get demo analytics
    const analytics = await DemoService.getDemoAnalytics();

    // Get demo categories
    const categories = await DemoService.getDemoCategories();

    // Get conversion funnel
    const conversionFunnel = await DemoService.getDemoConversionFunnel();

    // Get performance metrics
    const performanceMetrics = await DemoService.getDemoPerformanceMetrics();

    // Get recent activity (last 7 days)
    const recentStartDate = new Date();
    recentStartDate.setDate(recentStartDate.getDate() - 7);
    const recentAnalytics = await DemoService.getDemoAnalytics(recentStartDate);

    return NextResponse.json({
      success: true,
      data: {
        invitations,
        total,
        analytics,
        categories,
        conversionFunnel,
        performanceMetrics,
        recentAnalytics,
        summary: {
          totalInvitations: analytics.totalInvitations,
          scheduledDemos: analytics.scheduledDemos,
          completedDemos: analytics.completedDemos,
          conversionRate: analytics.conversionRate,
          avgDuration: analytics.avgDuration,
          avgEngagement: analytics.avgEngagement,
          avgSatisfaction: analytics.avgSatisfaction,
          followUpsRequired: analytics.followUpsRequired,
          activeCategories: categories.length
        }
      }
    });
  } catch (error) {
    logger.error('Error in demo dashboard API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to get demo dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 