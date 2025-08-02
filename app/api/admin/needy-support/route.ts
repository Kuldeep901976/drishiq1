import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      logger.error('Service client not available');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    let query = serviceClient
      .from('needy_individuals')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: needyIndividuals, error } = await query;

    if (error) {
      logger.error('Failed to fetch needy individuals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch needy individuals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      needyIndividuals: needyIndividuals || []
    });

  } catch (error) {
    logger.error('Error fetching needy individuals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, needyIds, status, notes } = body;

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      logger.error('Service client not available');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    if (action === 'bulk_update_status' && needyIds && status) {
      const { error } = await serviceClient
        .from('needy_individuals')
        .update({ 
          status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .in('id', needyIds);

      if (error) {
        logger.error('Failed to update needy individuals status:', error);
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${needyIds.length} needy individuals to ${status}`
      });

    } else if (action === 'bulk_delete' && needyIds) {
      const { error } = await serviceClient
        .from('needy_individuals')
        .delete()
        .in('id', needyIds);

      if (error) {
        logger.error('Failed to delete needy individuals:', error);
        return NextResponse.json(
          { error: 'Failed to delete needy individuals' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${needyIds.length} needy individuals`
      });

    } else if (action === 'approve' && needyIds) {
      const { error } = await serviceClient
        .from('needy_individuals')
        .update({ 
          status: 'enrolled',
          notes: notes || 'Approved for support',
          updated_at: new Date().toISOString()
        })
        .in('id', needyIds);

      if (error) {
        logger.error('Failed to approve needy individuals:', error);
        return NextResponse.json(
          { error: 'Failed to approve needy individuals' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Approved ${needyIds.length} needy individuals`
      });

    } else if (action === 'discard' && needyIds) {
      const { error } = await serviceClient
        .from('needy_individuals')
        .update({ 
          status: 'inactive',
          notes: notes || 'Discarded',
          updated_at: new Date().toISOString()
        })
        .in('id', needyIds);

      if (error) {
        logger.error('Failed to discard needy individuals:', error);
        return NextResponse.json(
          { error: 'Failed to discard needy individuals' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Discarded ${needyIds.length} needy individuals`
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Error in needy support management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 