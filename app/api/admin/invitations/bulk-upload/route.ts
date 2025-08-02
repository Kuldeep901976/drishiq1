import { supabase } from '@/lib/supabase';
import { parse } from 'csv-parse/sync';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    // Temporarily bypass all authentication for testing
    console.log('Bypassing authentication for testing...');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Read and parse CSV file
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer);
    
    let records: any[];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Validate required columns
    const requiredColumns = ['name', 'email', 'phone', 'language'];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Create bulk upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('needy_bulk_uploads')
      .insert({
        upload_name: `Bulk Upload - ${new Date().toLocaleString()}`,
        file_name: file.name,
        file_size: file.size,
        total_records: records.length,
        status: 'processing',
        uploaded_by: 'test-admin-id' // Replace with actual user ID
      })
      .select()
      .single();

    if (uploadError) {
      console.error('Error creating upload record:', uploadError);
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
    }

    // Process records
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate record
        if (!record.name || !record.email || !record.phone || !record.language) {
          throw new Error('Missing required fields');
        }

        // Check if email already exists
        const { data: existingInvitation } = await supabase
          .from('Invitations')
          .select('id')
          .eq('email', record.email)
          .single();

        if (existingInvitation) {
          throw new Error('Email already exists');
        }

        // Insert invitation
        const { error: insertError } = await supabase
          .from('Invitations')
          .insert({
            name: record.name,
            email: record.email,
            phone: record.phone,
            language: record.language,
            challenge: record.challenge || '',
            status: 'pending',
            invitation_type: 'bulk_uploaded',
            bulk_upload_id: uploadRecord.id,
            upload_row_number: i + 1
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        successfulRecords++;
      } catch (error: any) {
        failedRecords++;
        errors.push({
          row_number: i + 1,
          error: error.message,
          data: record
        });

        // Insert error record
        await supabase
          .from('needy_bulk_upload_errors')
          .insert({
            upload_id: uploadRecord.id,
            row_number: i + 1,
            error_message: error.message,
            raw_data: record
          });
      }
    }

    // Update upload record with results
    await supabase
      .from('needy_bulk_uploads')
      .update({
        processed_records: records.length,
        successful_records: successfulRecords,
        failed_records: failedRecords,
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', uploadRecord.id);

    return NextResponse.json({
      success: true,
      upload_id: uploadRecord.id,
      total_records: records.length,
      successful_records: successfulRecords,
      failed_records: failedRecords,
      errors: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error) {
    console.error('Failed to process bulk upload', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 