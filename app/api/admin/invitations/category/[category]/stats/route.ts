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

    // Validate category
    const validCategories = ['trial_access', 'need_support', 'testimonial', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get category statistics
    const { data: invitations, error } = await supabase
      .from('Invitation')
      .select(`
        id,
        status,
        created_at,
        credits:invitation_credits(
          credits_allocated,
          credits_used
        )
      `)
      .eq('category', category);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: invitations?.length || 0,
      pending: invitations?.filter(inv => inv.status === 'pending').length || 0,
      approved: invitations?.filter(inv => inv.status === 'approved').length || 0,
      used: invitations?.filter(inv => inv.status === 'used').length || 0,
      expired: invitations?.filter(inv => inv.status === 'expired').length || 0,
      creditsAllocated: 0,
      creditsUsed: 0
    };

    // Calculate credit statistics
    invitations?.forEach(invitation => {
      const credit = invitation.credits?.[0];
      if (credit) {
        stats.creditsAllocated += credit.credits_allocated || 0;
        stats.creditsUsed += credit.credits_used || 0;
      }
    });

    logger.info('Category statistics retrieved', { 
      adminId: session.user.id, 
      category, 
      stats 
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get category statistics', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 