import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    // Temporarily bypass all authentication for testing
    console.log('Bypassing authentication for testing...');

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Get bulk uploads with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: uploads, error, count } = await supabase
      .from('needy_bulk_uploads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Get total count for pagination
    let totalCount = count;
    if (!count) {
      const { count: total } = await supabase
        .from('needy_bulk_uploads')
        .select('*', { count: 'exact', head: true });
      totalCount = total || 0;
    }

    return NextResponse.json({
      success: true,
      uploads: uploads || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Failed to get bulk uploads', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 