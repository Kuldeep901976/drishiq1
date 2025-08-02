import { AdminService } from '@/lib/admin-service';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
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

    const { category } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;

    // Validate category
    const validCategories = ['trial_access', 'need_support', 'testimonial', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('Invitation')
      .select(`
        *,
        credits:invitation_credits(
          id,
          credits_allocated,
          credits_used,
          status,
          created_at
        )
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: invitations, error } = await query;

    if (error) throw error;

    // Transform data for frontend
    const transformedInvitations = invitations?.map((invitation: any) => ({
      ...invitation,
      credits_allocated: invitation.credits?.[0]?.credits_allocated || 0,
      credits_used: invitation.credits?.[0]?.credits_used || 0,
      credits_available: (invitation.credits?.[0]?.credits_allocated || 0) - (invitation.credits?.[0]?.credits_used || 0),
      credit_status: invitation.credits?.[0]?.status || 'none'
    })) || [];

    logger.info('Category invitations retrieved', { 
      adminId: session.user.id, 
      category, 
      count: transformedInvitations.length 
    });

    return NextResponse.json({
      success: true,
      data: transformedInvitations,
      pagination: {
        page,
        limit,
        total: transformedInvitations.length
      }
    });

  } catch (error) {
    logger.error('Failed to get category invitations', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 