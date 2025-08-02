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
    
    // Check if user has permission to view credits
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'view_credits'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const includeAllocations = searchParams.get('include_allocations') === 'true';
    
    const creditPools = await enterpriseService.getOrganizationCreditPools(params.id);
    
    const result: any = {
      success: true,
      credit_pools: creditPools
    };
    
    if (includeAllocations) {
      // Get user allocations for each pool
      const allocations = await Promise.all(
        creditPools.map(async (pool) => {
          const { data: poolAllocations, error } = await supabase
            .from('user_credit_allocations')
            .select(`
              *,
              user:users(id, email, name)
            `)
            .eq('organization_id', params.id)
            .eq('credit_pool_id', pool.id)
            .eq('is_active', true);
          
          if (error) throw error;
          
          return {
            pool_id: pool.id,
            allocations: poolAllocations || []
          };
        })
      );
      
      result.allocations = allocations;
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Error fetching organization credits:', error as Error);
    return handleApiError(error as Error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to manage credits
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_credits'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, ...data } = body;
    
    let result;
    
    switch (action) {
      case 'create_pool':
        const { name, description, total_credits, daily_limit, weekly_limit, monthly_limit } = data;
        
        if (!name || total_credits === undefined) {
          return NextResponse.json({ 
            error: 'Pool name and total credits are required' 
          }, { status: 400 });
        }
        
        result = await enterpriseService.createCreditPool({
          organization_id: params.id,
          name,
          description,
          total_credits,
          daily_limit,
          weekly_limit,
          monthly_limit
        });
        break;
        
      case 'allocate_credits':
        const { user_id, credit_pool_id, allocated_credits, daily_limit: userDailyLimit, weekly_limit: userWeeklyLimit, monthly_limit: userMonthlyLimit } = data;
        
        if (!user_id || !credit_pool_id || allocated_credits === undefined) {
          return NextResponse.json({ 
            error: 'User ID, credit pool ID, and allocated credits are required' 
          }, { status: 400 });
        }
        
        result = await enterpriseService.allocateCreditsToUser({
          organization_id: params.id,
          user_id,
          credit_pool_id,
          allocated_credits,
          daily_limit: userDailyLimit,
          weekly_limit: userWeeklyLimit,
          monthly_limit: userMonthlyLimit
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    logger.info(`Credit ${action} completed`, { 
      organizationId: params.id,
      action,
      performedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Error managing credits:', error as Error);
    return handleApiError(error as Error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to manage credits
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_credits'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { pool_id, total_credits, daily_limit, weekly_limit, monthly_limit, is_active } = body;
    
    if (!pool_id) {
      return NextResponse.json({ 
        error: 'Pool ID is required' 
      }, { status: 400 });
    }
    
    const updates: any = {};
    if (total_credits !== undefined) updates.total_credits = total_credits;
    if (daily_limit !== undefined) updates.daily_limit = daily_limit;
    if (weekly_limit !== undefined) updates.weekly_limit = weekly_limit;
    if (monthly_limit !== undefined) updates.monthly_limit = monthly_limit;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const { data, error } = await supabase
      .from('organization_credit_pools')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', pool_id)
      .eq('organization_id', params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    logger.info('Credit pool updated', { 
      organizationId: params.id,
      poolId: pool_id,
      updates: Object.keys(updates),
      performedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      credit_pool: data
    });
    
  } catch (error) {
    logger.error('Error updating credit pool:', error as Error);
    return handleApiError(error as Error);
  }
} 