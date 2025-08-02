import { logger } from '@/lib/logger';
import { NeedySupportService } from '@/lib/needy-support-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadName = formData.get('uploadName') as string;

    if (!file || !uploadName) {
      return NextResponse.json({ 
        error: 'File and upload name are required' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        error: 'Only CSV files are supported' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    const result = await NeedySupportService.bulkUploadNeedyIndividuals(
      file,
      uploadName,
      user.id
    );

    logger.info('Bulk upload completed', { 
      upload_id: result.upload_id,
      total_records: result.total_records,
      successful_records: result.successful_records,
      failed_records: result.failed_records,
      uploaded_by: user.id
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error in bulk upload API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const uploadId = searchParams.get('uploadId');

    switch (action) {
      case 'status':
        if (!uploadId) {
          return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
        }
        const status = await NeedySupportService.getBulkUploadStatus(uploadId);
        return NextResponse.json({ success: true, data: status });

      case 'errors':
        if (!uploadId) {
          return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
        }
        const errors = await NeedySupportService.getBulkUploadErrors(uploadId);
        return NextResponse.json({ success: true, data: errors });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in bulk upload API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 