import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'published';
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const featured = url.searchParams.get('featured') === 'true';

    // Build query
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Apply featured filter
    if (featured) {
      query = query.eq('featured', true);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) throw error;

    // Get total count for pagination
    let countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact' });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }
    if (featured) {
      countQuery = countQuery.eq('featured', true);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
} 