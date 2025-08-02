import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
export async function GET() {
  try {
    
    // Check admin authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create service client for admin operations
    const serviceClient = supabase;

    // Fetch invitation requests with needy individual details
    const { data: requests, error } = await serviceClient
      .from('invitation_requests')
      .select(`
        *,
        needy_individuals (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitation requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // Transform data for frontend
    const transformedRequests = requests?.map((request: any) => ({
      id: request.id,
      needy_individual_id: request.needy_individual_id,
      needy_name: request.needy_individuals?.full_name || 'Unknown',
      needy_email: request.needy_individuals?.email || '',
      needy_phone: request.needy_individuals?.phone || '',
      invitation_type: request.invitation_type,
      status: request.status,
      requested_at: request.requested_at,
      approved_at: request.approved_at,
      magic_link: request.magic_link,
      credits_allocated: request.credits_allocated
    })) || [];

    return NextResponse.json({ requests: transformedRequests });
  } catch (error) {
    console.error('Error in GET /api/admin/needy-support/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    
    // Check admin authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, requestId } = await request.json();

    if (!action || !requestId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create service client for admin operations
    const serviceClient = supabase;

    switch (action) {
      case 'approve':
        return await handleApproveRequest(serviceClient, requestId);
      
      case 'reject':
        return await handleRejectRequest(serviceClient, requestId);
      
      case 'send_magic_link':
        return await handleSendMagicLink(serviceClient, requestId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/admin/needy-support/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleApproveRequest(serviceClient: any, requestId: string) {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await serviceClient
      .from('invitation_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update request status to approved
    const { error: updateError } = await serviceClient
      .from('invitation_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        credits_allocated: 1 // Allocate 1 credit for the invitation
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error approving request:', updateError);
      return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Request approved successfully' });
  } catch (error) {
    console.error('Error in handleApproveRequest:', error);
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
  }
}

async function handleRejectRequest(serviceClient: any, requestId: string) {
  try {
    // Update request status to rejected
    const { error: updateError } = await serviceClient
      .from('invitation_requests')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error rejecting request:', updateError);
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error in handleRejectRequest:', error);
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
  }
}

async function handleSendMagicLink(serviceClient: any, requestId: string) {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await serviceClient
      .from('invitation_requests')
      .select(`
        *,
        needy_individuals (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'approved') {
      return NextResponse.json({ error: 'Request must be approved before sending magic link' }, { status: 400 });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 1 week expiry

    // Create magic link
    const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`;

    // Store the invitation in the Invitations table
    const { error: insertError } = await serviceClient
      .from('Invitations')
      .insert({
        name: request.needy_individuals?.full_name || 'User',
        email: request.needy_individuals?.email || '',
        phone: request.needy_individuals?.phone || '',
        language: 'en',
        status: 'approved',
        token: token,
        expires_at: expiresAt.toISOString(),
        invitation_type: request.invitation_type,
        category: 'needy_support',
        needy_individual_id: request.needy_individual_id
      });

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Update request status to sent
    const { error: updateError } = await serviceClient
      .from('invitation_requests')
      .update({
        status: 'sent',
        magic_link: magicLink
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 });
    }

    // TODO: Send email with magic link
    // This would integrate with your email service

    return NextResponse.json({ 
      success: true, 
      message: 'Magic link sent successfully',
      magic_link: magicLink
    });
  } catch (error) {
    console.error('Error in handleSendMagicLink:', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
} 