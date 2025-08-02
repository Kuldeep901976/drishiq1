import { AdminService } from '@/lib/admin-service';
import { logger } from '@/lib/logger';

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

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

    // Parse request body
    const body = await request.json();
    const { invitationId, credits, reason } = body;

    // Validate input
    if (!invitationId || !credits || credits <= 0 || !reason) {
      return NextResponse.json(
        { error: 'Invalid input: invitationId, credits (positive number), and reason are required' },
        { status: 400 }
      );
    }

    // Check if invitation exists
    const { data: invitation, error: invitationError } = await supabase
      .from('Invitation')
      .select('id, name, email, category')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if credits already allocated for this invitation
    const { data: existingCredit, error: existingError } = await supabase
      .from('invitation_credits')
      .select('id, credits_allocated, credits_used')
      .eq('invitation_id', invitationId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    let creditRecord;
    if (existingCredit) {
      // Update existing credit allocation
      const { data: updatedCredit, error: updateError } = await supabase
        .from('invitation_credits')
        .update({
          credits_allocated: existingCredit.credits_allocated + credits,
          reason: reason,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id
        })
        .eq('id', existingCredit.id)
        .select()
        .single();

      if (updateError) throw updateError;
      creditRecord = updatedCredit;
    } else {
      // Create new credit allocation
      const { data: newCredit, error: createError } = await supabase
        .from('invitation_credits')
        .insert({
          invitation_id: invitationId,
          credits_allocated: credits,
          credits_used: 0,
          reason: reason,
          status: 'active',
          created_by: session.user.id,
          updated_by: session.user.id
        })
        .select()
        .single();

      if (createError) throw createError;
      creditRecord = newCredit;
    }

    // Log the credit allocation
    logger.info('Credits allocated to invitation', {
      adminId: session.user.id,
      invitationId,
      credits,
      reason,
      totalAllocated: creditRecord.credits_allocated
    });

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${credits} credits to ${invitation.name}`,
      data: {
        id: creditRecord.id,
        invitationId: creditRecord.invitation_id,
        creditsAllocated: creditRecord.credits_allocated,
        creditsUsed: creditRecord.credits_used,
        available: creditRecord.credits_allocated - creditRecord.credits_used
      }
    });

  } catch (error) {
    logger.error('Failed to allocate credits', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 