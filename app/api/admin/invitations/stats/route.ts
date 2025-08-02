
import { createServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    // Create service client for admin operations
    const supabase = createServiceClient();
    if (!supabase) {
      console.error('Failed to create Supabase service client');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Temporarily bypass all authentication for testing
    console.log('Bypassing authentication for testing...');

    // Get invitation statistics
    console.log('Querying Invitations table...');
    const { data: invitations, error } = await supabase
      .from('Invitations')
      .select('*');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Found invitations:', invitations?.length || 0);
    console.log('Sample invitation data:', invitations?.[0]);

    // Log invitation types found
    const types = invitations?.map((i: any) => i.invitation_type) || [];
    console.log('Invitation types found:', [...new Set(types)]);

    // Log statuses found
    const statuses = invitations?.map((i: any) => i.status) || [];
    console.log('Statuses found:', [...new Set(statuses)]);

    const stats = {
      total: invitations?.length || 0,
      pending: invitations?.filter((i: any) => i.status === 'pending').length || 0,
      approved: invitations?.filter((i: any) => i.status === 'approved').length || 0,
      used: invitations?.filter((i: any) => i.status === 'used').length || 0,
      expired: invitations?.filter((i: any) => i.status === 'expired').length || 0,
      trial: invitations?.filter((i: any) => i.invitation_type === 'trial').length || 0,
      needSupport: invitations?.filter((i: any) => i.invitation_type === 'need_support').length || 0,
      testimonials: invitations?.filter((i: any) => i.invitation_type === 'testimonials').length || 0,
      bulkUploaded: invitations?.filter((i: any) => i.invitation_type === 'bulk_uploaded').length || 0
    };

    console.log('Stats calculated:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to get admin invitation stats', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 