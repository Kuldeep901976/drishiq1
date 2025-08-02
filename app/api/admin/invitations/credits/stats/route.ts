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

    // Get credit statistics
    const { data: creditStats, error } = await supabase
      .from('invitation_credits')
      .select(`
        *,
        invitation:invitation_id (
          id,
          name,
          email,
          category
        )
      `);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      totalAllocated: 0,
      totalUsed: 0,
      totalAvailable: 0,
      byCategory: {
        trial_access: { allocated: 0, used: 0 },
        need_support: { allocated: 0, used: 0 },
        testimonial: { allocated: 0, used: 0 }
      }
    };

    creditStats?.forEach(credit => {
      const category = credit.invitation?.category || 'general';
      const allocated = credit.credits_allocated || 0;
      const used = credit.credits_used || 0;

      stats.totalAllocated += allocated;
      stats.totalUsed += used;

      if (stats.byCategory[category as keyof typeof stats.byCategory]) {
        stats.byCategory[category as keyof typeof stats.byCategory].allocated += allocated;
        stats.byCategory[category as keyof typeof stats.byCategory].used += used;
      }
    });

    stats.totalAvailable = stats.totalAllocated - stats.totalUsed;

    logger.info('Credit statistics retrieved', { adminId: session.user.id });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get credit statistics', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 