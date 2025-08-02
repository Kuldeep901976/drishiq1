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

    // Get invitation requests
    const result = await AdminService.getInvitationRequests(page, limit, status);

    logger.info('Admin invitation requests retrieved', { adminId: session.user.id });

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
    logger.error('Failed to get admin invitation requests');
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
    const { action, requestId, requestIds, reason, sendEmail } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        if (!requestId) {
          return NextResponse.json(
            { error: 'Request ID is required for approve action' },
            { status: 400 }
          );
        }
        result = await AdminService.approveInvitation(
          requestId,
          session.user.id,
          sendEmail !== false
        );
        break;

      case 'reject':
        if (!requestId) {
          return NextResponse.json(
            { error: 'Request ID is required for reject action' },
            { status: 400 }
          );
        }
        result = await AdminService.rejectInvitation(
          requestId,
          session.user.id,
          reason
        );
        break;

      case 'bulk_approve':
        if (!requestIds || !Array.isArray(requestIds)) {
          return NextResponse.json(
            { error: 'Request IDs array is required for bulk approve' },
            { status: 400 }
          );
        }
        result = await AdminService.bulkApproveInvitations(
          requestIds,
          session.user.id
        );
        break;

      case 'send_magic_link':
        if ((!requestId && !requestIds) || (requestIds && !Array.isArray(requestIds))) {
          return NextResponse.json(
            { error: 'Request ID or IDs array is required for send_magic_link' },
            { status: 400 }
          );
        }
        result = await AdminService.sendMagicLink(
          requestId ? [requestId] : requestIds,
          session.user.id
        );
        break;

      case 'discard':
        if ((!requestId && !requestIds) || (requestIds && !Array.isArray(requestIds))) {
          return NextResponse.json(
            { error: 'Request ID or IDs array is required for discard' },
            { status: 400 }
          );
        }
        result = await AdminService.discardInvitations(
          requestId ? [requestId] : requestIds,
          session.user.id
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    logger.info('Admin invitation action completed', { 
      adminId: session.user.id, 
      action,
      requestId,
      requestIds 
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to process admin invitation action');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 