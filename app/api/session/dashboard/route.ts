
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { SessionService } from '../../../../lib/session-service';



import { supabase } from '../../../../lib/supabase';
export async function GET(request: NextRequest) {
  try {
    // Get user from auth
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user sessions
    const { sessions, total } = await SessionService.getUserSessions(user.id, limit, offset);

    // Get user session statistics
    const stats = await SessionService.getUserSessionStats(user.id);

    // Get active sessions
    const activeSessions = await SessionService.getActiveSessions(user.id);

    // Get session types
    const sessionTypes = await SessionService.getSessionTypes();

    // Get user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Error getting user credits', { error: userError, userId: user.id });
      throw userError;
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total,
        stats,
        activeSessions,
        sessionTypes,
        userCredits: userData?.credits || 0,
        summary: {
          totalSessions: stats.totalSessions,
          completedSessions: stats.completedSessions,
          totalMinutes: stats.totalMinutes,
          totalCreditsUsed: stats.totalCreditsUsed,
          avgSessionDuration: stats.avgSessionDuration,
          completionRate: stats.completionRate,
          activeSessions: activeSessions.length,
          availableCredits: userData?.credits || 0
        }
      }
    });
  } catch (error) {
    logger.error('Error in session dashboard API', { error });
    return NextResponse.json({
      error: 'Failed to get session dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 