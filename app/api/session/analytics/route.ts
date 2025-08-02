import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { sessionService } from '@/lib/session-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');
    const days = parseInt(searchParams.get('days') || '30');
    
    // Check if user is admin for accessing other users' analytics
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = userData?.role === 'admin';
    
    if (targetUserId && targetUserId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = targetUserId || user.id;
    
    // Get session analytics
    const sessionAnalytics = await sessionService.getUserSessionStats(userId);
    
    // Get current user's credit balance
    const { data: userCredits } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    const analytics = {
      user_analytics: sessionAnalytics || {
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        totalCreditsUsed: 0,
        avgSessionDuration: 0,
        completionRate: 0,
        recentStats: []
      },
      current_credits: userCredits?.credits || 0
    };
    
    logger.info('Session analytics fetched', { 
      userId: userId,
      requestedBy: user.id,
      isAdmin
    });
    
    return NextResponse.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    logger.error('Error fetching session analytics:', error);
    return handleApiError(error);
  }
} 