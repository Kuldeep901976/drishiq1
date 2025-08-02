import { AdminService } from '@/lib/admin-service';
import { logger } from '@/lib/logger';

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin access
    const adminCheck = await AdminService.checkAdminAccess(session.user.id);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || undefined;

    // Build query
    let query = supabase
      .from('invitation_credits')
      .select(`
        *,
        invitation:invitation_id (
          id,
          name,
          email,
          category,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: allocations, error } = await query;

    if (error) throw error;

    // Transform data for frontend
    const transformedAllocations = allocations?.map((allocation: any) => ({
      id: allocation.id,
      invitationId: allocation.invitation_id,
      invitationName: allocation.invitation?.name || 'Unknown',
      invitationEmail: allocation.invitation?.email || 'Unknown',
      category: allocation.invitation?.category || 'general',
      creditsAllocated: allocation.credits_allocated || 0,
      creditsUsed: allocation.credits_used || 0,
      allocationDate: allocation.created_at,
      reason: allocation.reason || '',
      allocatedBy: allocation.allocated_by || 'System',
      status: allocation.status || 'active'
    })) || [];

    logger.info('Credit allocations retrieved', { adminId: session.user.id });

    return NextResponse.json({
      success: true,
      data: transformedAllocations
    });

  } catch (error) {
    logger.error('Failed to get credit allocations', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 