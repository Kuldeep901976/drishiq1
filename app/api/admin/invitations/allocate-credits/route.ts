import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    // Temporarily bypass all authentication for testing
    console.log('Bypassing authentication for testing...');

    const body = await request.json();
    const { invitation_id, credits = 1 } = body;

    if (!invitation_id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const supporterId = 'test-admin-id'; // Replace with actual user ID

    // Check if invitation exists and doesn't have credits already allocated
    const { data: invitation, error: fetchError } = await supabase
      .from('Invitations')
      .select('id, name, email, credits_allocated, invitation_type')
      .eq('id', invitation_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.credits_allocated > 0) {
      return NextResponse.json(
        { error: 'Credits already allocated to this invitation' },
        { status: 400 }
      );
    }

    // Allocate credits using the database function
    const { error: allocationError } = await supabase.rpc('allocate_credits_to_invitation', {
      p_invitation_id: invitation_id,
      p_supporter_id: supporterId,
      p_credits: credits
    });

    if (allocationError) {
      console.error('Database error:', allocationError);
      return NextResponse.json(
        { error: 'Failed to allocate credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credits allocated successfully',
      invitation_id,
      credits_allocated: credits
    });

  } catch (error) {
    console.error('Failed to allocate credits', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 