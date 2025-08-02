import { createServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const duration = searchParams.get('duration') || '7d';
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('search') || '';

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      console.error('Service client is null - missing environment variables');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Calculate date range based on duration
    const now = new Date();
    let startDate: Date;
    
    switch (duration) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    let query = serviceClient
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent performance issues

    // Apply action filter
    if (action !== 'all') {
      query = query.eq('action_type', action);
    }

    // Apply search filter
    if (search) {
      query = query.or(`admin_email.ilike.%${search}%,action_type.ilike.%${search}%,table_name.ilike.%${search}%`);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      auditLogs: auditLogs || [],
      pagination: {
        page: 1,
        limit: 1000,
        total: auditLogs?.length || 0,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient();
    
    if (!serviceClient) {
      console.error('Service client is null - missing environment variables');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, auditLogId, adminEmail } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'restore':
        if (!auditLogId) {
          return NextResponse.json(
            { error: 'Audit log ID is required for restore operation' },
            { status: 400 }
          );
        }

        // Get the audit log entry
        const { data: auditLog, error: fetchError } = await serviceClient
          .from('audit_logs')
          .select('*')
          .eq('id', auditLogId)
          .single();

        if (fetchError || !auditLog) {
          console.error('Failed to fetch audit log:', fetchError);
          return NextResponse.json(
            { error: 'Failed to fetch audit log' },
            { status: 500 }
          );
        }

        // Only allow restoration of deleted records
        if (auditLog.action_type !== 'delete') {
          return NextResponse.json(
            { error: 'Only deleted records can be restored' },
            { status: 400 }
          );
        }

        // Restore the record using the old_data
        const { error: restoreError } = await serviceClient
          .from(auditLog.table_name)
          .insert(auditLog.old_data);

        if (restoreError) {
          console.error('Failed to restore record:', restoreError);
          return NextResponse.json(
            { error: 'Failed to restore record' },
            { status: 500 }
          );
        }

        // Log the restoration action
        await serviceClient.rpc('log_invitation_audit_event', {
          p_action_type: 'restore',
          p_table_name: 'audit_logs',
          p_record_id: auditLogId,
          p_admin_email: adminEmail || 'system',
          p_old_data: auditLog,
          p_new_data: { ...auditLog, restored: true },
          p_action_details: { restored_from_audit_id: auditLogId },
          p_ip_address: null,
          p_user_agent: null
        });

        return NextResponse.json({
          success: true,
          message: 'Record restored successfully'
        });

      case 'cleanup':
        // Clean up audit logs older than 1 year
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        const { error: cleanupError } = await serviceClient
          .from('audit_logs')
          .delete()
          .lt('created_at', oneYearAgo.toISOString());

        if (cleanupError) {
          console.error('Failed to cleanup audit logs:', cleanupError);
          return NextResponse.json(
            { error: 'Failed to cleanup audit logs' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Audit logs cleanup completed successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failed to process audit log action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 