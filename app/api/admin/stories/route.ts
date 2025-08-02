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

    // Get stories
    const result = await AdminService.getStories(page, limit, status);

    logger.info('Admin stories retrieved', { adminId: session.user.id });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get admin stories');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, storyId, notes, grantInvitation } = body;

    if (!action || !storyId) {
      return NextResponse.json(
        { error: 'Action and story ID are required' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject', 'publish'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or publish' },
        { status: 400 }
      );
    }

    // Review story
    const result = await AdminService.reviewStory(
      storyId,
      session.user.id,
      action as 'approve' | 'reject' | 'publish',
      notes,
      grantInvitation
    );

    logger.info('Admin story review completed', { 
      adminId: session.user.id, 
      action,
      storyId,
      grantInvitation 
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to process admin story review');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 