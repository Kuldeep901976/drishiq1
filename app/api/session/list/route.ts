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
    const status = searchParams.get('status') as any;
    const includeActivities = searchParams.get('include_activities') === 'true';
    const includeCreditTransactions = searchParams.get('include_credit_transactions') === 'true';
    
    const sessions = await sessionService.getUserSessions(user.id, status);
    
    // Optionally include additional data
    const enrichedSessions = await Promise.all(
      sessions.sessions.map(async (session) => {
        const enriched: any = { ...session };
        
        if (includeCreditTransactions) {
          enriched.credit_transactions = await sessionService.getCreditTransactions(user.id, session.id);
        }
        
        return enriched;
      })
    );
    
    logger.info('User sessions fetched', { 
      userId: user.id,
      count: sessions.sessions.length,
      status
    });
    
    return NextResponse.json({
      success: true,
      sessions: enrichedSessions
    });
    
  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    return handleApiError(error);
  }
} 