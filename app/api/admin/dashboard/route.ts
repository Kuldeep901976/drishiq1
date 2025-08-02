import { logger } from '@/lib/logger';
import { NeedySupportService } from '@/lib/needy-support-service';
import { createServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass authentication for testing
    // TODO: Re-enable authentication once admin system is properly set up
    console.log('Dashboard API called - bypassing authentication for testing');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeframe = searchParams.get('timeframe') || '30d';

    switch (action) {
      case 'overview':
        const overviewData = await getOverviewData();
        return NextResponse.json({ success: true, data: overviewData });

      case 'invitation-types':
        const typeData = await getInvitationTypeData();
        return NextResponse.json({ success: true, data: typeData });

      case 'monthly-trends':
        const trendData = await getMonthlyTrendData(timeframe);
        return NextResponse.json({ success: true, data: trendData });

      case 'recent-activity':
        const activityData = await getRecentActivityData();
        return NextResponse.json({ success: true, data: activityData });

      case 'needy-support-stats':
        const needyStats = await getNeedySupportStats();
        return NextResponse.json({ success: true, data: needyStats });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewData() {
  const supabase = createServiceClient();
  
  // Get invitation statistics with type breakdown
  const { data: invitations } = await supabase
    .from('Invitations')
    .select('status, invitation_type, created_at');

  const invitationCounts = invitations?.reduce((acc: Record<string, number>, inv: any) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate type breakdown
  const typeCounts = invitations?.reduce((acc: Record<string, number>, inv: any) => {
    const type = inv.invitation_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate growth rates (comparing current period with previous period)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentPeriodInvitations = invitations?.filter((inv: any) => new Date(inv.created_at) >= thirtyDaysAgo).length || 0;
  const previousPeriodInvitations = invitations?.filter((inv: any) => {
    const created = new Date(inv.created_at);
    return created >= sixtyDaysAgo && created < thirtyDaysAgo;
  }).length || 0;

  const invitationGrowthRate = previousPeriodInvitations > 0 
    ? ((currentPeriodInvitations - previousPeriodInvitations) / previousPeriodInvitations) * 100 
    : 0;

  return {
    invitations: {
      total: invitations?.length || 0,
      pending: invitationCounts.pending || 0,
      approved: invitationCounts.approved || 0,
      used: invitationCounts.used || 0,
      expired: invitationCounts.expired || 0,
      trial: typeCounts.trial || 0,
      need_support: typeCounts.need_support || 0,
      testimonial: typeCounts.testimonial || 0,
      growthRate: Math.round(invitationGrowthRate * 100) / 100
    },
    needySupport: {
      totalNeedy: 0,
      activeNeedy: 0,
      totalSupportCredits: 0,
      usedSupportCredits: 0,
      availableCredits: 0,
      pendingRequests: 0
    }
  };
}

async function getInvitationTypeData() {
  const supabase = createServiceClient();
  
  const types = ['testimonial'];
  const typeStats = [];

  for (const type of types) {
    const { data } = await supabase
      .from('Invitations')
      .select('status, created_at')
      .eq('invitation_type', type);

    const counts = data?.reduce((acc: Record<string, number>, inv: any) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate conversion rate (used / total)
    const total = data?.length || 0;
    const used = counts.used || 0;
    const conversionRate = total > 0 ? (used / total) * 100 : 0;

    typeStats.push({
      type: type.replace('_', ' '),
      total,
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      used,
      expired: counts.expired || 0,
      conversionRate: Math.round(conversionRate * 100) / 100
    });
  }

  return typeStats;
}

async function getMonthlyTrendData(timeframe: string) {
  const supabase = createServiceClient();
  
  // Calculate date range based on timeframe
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get invitations created in the timeframe
  const { data: invitations } = await supabase
    .from('Invitations')
    .select('created_at, invitation_type')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Group by month
  const monthlyData: Record<string, { invitations: number; types: Record<string, number> }> = {};
  
  invitations?.forEach((invitation: any) => {
    const date = new Date(invitation.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { invitations: 0, types: {} };
    }
    
    monthlyData[monthKey].invitations++;
    monthlyData[monthKey].types[invitation.invitation_type || 'unknown'] = 
      (monthlyData[monthKey].types[invitation.invitation_type || 'unknown'] || 0) + 1;
  });

  // Convert to array format
  const trendData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    invitations: data.invitations,

    testimonials: data.types.testimonial || 0
  }));

  return trendData;
}

async function getRecentActivityData() {
  const supabase = createServiceClient();
  
  // Get recent invitations
  const { data: recentInvitations } = await supabase
    .from('Invitations')
    .select('id, name, email, invitation_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent support credit transactions
  const { data: recentTransactions } = await supabase
    .from('support_credit_transactions')
    .select(`
      id, transaction_type, credits_amount, created_at,
      supporter:users(email, full_name),
      needy:needy_individuals(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent bulk uploads
  const { data: recentUploads } = await supabase
    .from('needy_bulk_uploads')
    .select('id, upload_name, status, successful_records, failed_records, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const activities: any[] = [];

  // Add invitation activities
  recentInvitations?.forEach((invitation: any) => {
    activities.push({
      id: invitation.id,
      type: 'invitation',
      action: `New ${invitation.invitation_type?.replace('_', ' ')} invitation created`,
      details: `${invitation.name} (${invitation.email})`,
      status: invitation.status,
      timestamp: invitation.created_at,
      category: invitation.invitation_type
    });
  });

  // Add transaction activities
  recentTransactions?.forEach((transaction: any) => {
    activities.push({
      id: transaction.id,
      type: 'transaction',
      action: `Support credits ${transaction.transaction_type}`,
      details: `${transaction.credits_amount} credits for ${transaction.needy?.full_name || 'Unknown'}`,
      status: 'completed',
      timestamp: transaction.created_at,
      category: 'needy_support'
    });
  });

  // Add upload activities
  recentUploads?.forEach((upload: any) => {
    activities.push({
      id: upload.id,
      type: 'upload',
      action: `Bulk upload ${upload.status}`,
      details: `${upload.upload_name} - ${upload.successful_records} successful, ${upload.failed_records} failed`,
      status: upload.status,
      timestamp: upload.created_at,
      category: 'needy_support'
    });
  });

  // Sort by timestamp and return
  return activities
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}

async function getNeedySupportStats() {
  try {
    const needySummary = await NeedySupportService.getNeedySupportSummary();
    const supporterImpact = await NeedySupportService.getSupporterImpactSummary();

    // Calculate top supporters
    const topSupporters = supporterImpact
      .sort((a: any, b: any) => (b.total_credits_allocated || 0) - (a.total_credits_allocated || 0))
      .slice(0, 5);

    // Calculate needy individuals by urgency
    const urgencyStats = needySummary.reduce((acc: Record<string, number>, needy: any) => {
      const urgency = needy.urgency_level || 'medium';
      acc[urgency] = (acc[urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate needy individuals by country
    const countryStats = needySummary.reduce((acc: Record<string, number>, needy: any) => {
      const country = needy.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top countries
    const topCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    return {
      summary: {
        totalNeedy: needySummary.length,
        activeNeedy: needySummary.filter((n: any) => n.needy_status === 'active').length,
        verifiedNeedy: needySummary.filter((n: any) => n.is_verified).length,
        averagePriorityScore: Math.round(
          needySummary.reduce((sum: number, n: any) => sum + (n.priority_score || 0), 0) / needySummary.length
        )
      },
      urgencyDistribution: urgencyStats,
      topCountries,
      topSupporters: topSupporters.map((supporter: any) => ({
        name: supporter.supporter_name || supporter.supporter_email,
        email: supporter.supporter_email,
        totalAllocated: supporter.total_credits_allocated || 0,
        totalUsed: supporter.total_credits_used || 0,
        totalNeedySupported: supporter.total_needy_supported || 0
      }))
    };
  } catch (error) {
    logger.error('Error getting needy support stats:', error);
    return {
      summary: { totalNeedy: 0, activeNeedy: 0, verifiedNeedy: 0, averagePriorityScore: 0 },
      urgencyDistribution: {},
      topCountries: [],
      topSupporters: []
    };
  }
} 