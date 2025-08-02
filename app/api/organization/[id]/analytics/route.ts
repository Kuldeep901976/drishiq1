import { enterpriseService } from '@/lib/enterprise-service';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to view analytics
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'view_analytics'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('include_members') === 'true';
    const includeActivity = searchParams.get('include_activity') === 'true';
    const activityLimit = parseInt(searchParams.get('activity_limit') || '50');
    
    // Get organization analytics
    const resultObj = await enterpriseService.getOrganizationAnalytics(params.id);
    
    if (includeMembers) {
      resultObj.member_analytics = await enterpriseService.getOrganizationMemberAnalytics(params.id);
    }
    
    if (includeActivity) {
      resultObj.activity_logs = await enterpriseService.getOrganizationActivityLogs(params.id, activityLimit);
    }
    
    return NextResponse.json(resultObj);
    
  } catch (error) {
    logger.error('Error fetching organization analytics:', error as Error);
    return handleApiError(error as Error);
  }
} 