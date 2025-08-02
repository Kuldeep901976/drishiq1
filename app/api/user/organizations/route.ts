import { enterpriseService } from '@/lib/enterprise-service';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const includeCredits = searchParams.get('include_credits') === 'true';
    
    const organizations = await enterpriseService.getUserOrganizations(user.id);
    
    const result: any = {
      success: true,
      organizations: organizations
    };
    
    if (includeAnalytics || includeCredits) {
      const enrichedOrganizations = await Promise.all(
        result.organizations.map(async (org: any) => {
          const enriched: any = { ...org };
          
          if (includeAnalytics) {
            try {
              enriched.analytics = await enterpriseService.getOrganizationAnalytics(org.id);
            } catch (error) {
              logger.warn(`Failed to fetch analytics for organization ${org.id}:`, { error: error instanceof Error ? error.message : String(error) });
              enriched.analytics = null;
            }
          }
          
          if (includeCredits) {
            try {
              enriched.credit_allocations = await enterpriseService.getUserCreditAllocations(org.id, user.id);
            } catch (error) {
              logger.warn(`Failed to fetch credit allocations for organization ${org.id}:`, { error: error instanceof Error ? error.message : String(error) });
              enriched.credit_allocations = [];
            }
          }
          
          return enriched;
        })
      );
      
      result.organizations = enrichedOrganizations;
    }
    
    logger.info('User organizations fetched', { 
      userId: user.id,
      organizationCount: result.length
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Error fetching user organizations:', error);
    return handleApiError(error);
  }
} 