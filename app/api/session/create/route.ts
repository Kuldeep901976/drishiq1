import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { sessionService } from '@/lib/session-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      template_id, 
      session_type, 
      title, 
      description, 
      scheduled_at, 
      duration_minutes, 
      credit_cost,
      session_data,
      metadata 
    } = body;
    
    if (!session_type || !title || !duration_minutes || credit_cost === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    const sessionId = await sessionService.startSession(
      user.id,
      session_type,
      title,
      description,
      scheduled_at ? new Date(scheduled_at) : undefined
    );
    
    // Get the created session details
    const sessionDetails = await sessionService.getSessionDetails(sessionId);
    
    logger.info('Session created successfully', { 
      sessionId: sessionDetails.session.id,
      userId: user.id,
      type: session_type
    });
    
    return NextResponse.json({
      success: true,
      session: sessionDetails.session
    });
    
  } catch (error) {
    logger.error('Error creating session:', error);
    return handleApiError(error);
  }
} 