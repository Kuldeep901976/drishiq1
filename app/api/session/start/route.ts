
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { SessionService } from '../../../../lib/session-service';



import { supabase } from '../../../../lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { sessionTypeId, title, description, scheduledAt } = await request.json();
    
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

    if (!sessionTypeId) {
      return NextResponse.json({ 
        error: 'Session type ID is required' 
      }, { status: 400 });
    }

    // Start the session
    const sessionId = await SessionService.startSession(
      user.id,
      sessionTypeId,
      title,
      description,
      scheduledAt ? new Date(scheduledAt) : undefined
    );

    logger.info('Session started via API', { 
      userId: user.id, 
      sessionTypeId, 
      sessionId 
    });

    return NextResponse.json({
      success: true,
      data: { sessionId },
      message: 'Session started successfully'
    });
  } catch (error) {
    logger.error('Error in session start API', { error });
    return NextResponse.json({
      error: 'Failed to start session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    // Get session types
    const sessionTypes = await SessionService.getSessionTypes();

    return NextResponse.json({
      success: true,
      data: sessionTypes
    });
  } catch (error) {
    logger.error('Error in session types API', { error });
    return NextResponse.json({
      error: 'Failed to get session types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 