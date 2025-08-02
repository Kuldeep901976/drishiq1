
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { SessionService } from '../../../../lib/session-service';



import { supabase } from '../../../../lib/supabase';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
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

    // Get session details
    const sessionDetails = await SessionService.getSessionDetails(sessionId);

    // Verify user owns this session
    if (sessionDetails.session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: sessionDetails
    });
  } catch (error) {
    logger.error('Error in session details API', { error });
    return NextResponse.json({
      error: 'Failed to get session details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { action, reason, additionalMinutes } = await request.json();
    
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

    // Verify user owns this session
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case 'end':
        await SessionService.endSession(sessionId, reason || 'completed');
        break;
      case 'pause':
        await SessionService.pauseSession(sessionId);
        break;
      case 'resume':
        await SessionService.resumeSession(sessionId);
        break;
      case 'extend':
        if (!additionalMinutes) {
          return NextResponse.json({ 
            error: 'Additional minutes required for extend action' 
          }, { status: 400 });
        }
        await SessionService.extendSession(sessionId, additionalMinutes);
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Must be one of: end, pause, resume, extend' 
        }, { status: 400 });
    }

    logger.info('Session action completed', { 
      sessionId, 
      action, 
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      message: `Session ${action} completed successfully`
    });
  } catch (error) {
    logger.error('Error in session action API', { error });
    return NextResponse.json({
      error: 'Failed to perform session action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
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

    // Verify user owns this session
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // End session if it's active
    if (session.status === 'active') {
      await SessionService.endSession(sessionId, 'cancelled');
    }

    logger.info('Session cancelled', { 
      sessionId, 
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    logger.error('Error in session cancel API', { error });
    return NextResponse.json({
      error: 'Failed to cancel session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 