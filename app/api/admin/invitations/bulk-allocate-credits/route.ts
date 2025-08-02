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
    const { 
      invitationIds, 
      credits, 
      reason, 
      criteria,
      category 
    } = body;

    // Validate input
    if (!invitationIds || !Array.isArray(invitationIds) || invitationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation IDs' },
        { status: 400 }
      );
    }

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Invalid credits amount' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Get invitations to validate
    const { data: invitations, error: fetchError } = await supabase
      .from('Invitation')
      .select('id, name, email, category, status')
      .in('id', invitationIds);

    if (fetchError) throw fetchError;

    if (!invitations || invitations.length !== invitationIds.length) {
      return NextResponse.json(
        { error: 'Some invitations not found' },
        { status: 404 }
      );
    }

    // Validate category if specified
    if (category && invitations.some(inv => inv.category !== category)) {
      return NextResponse.json(
        { error: 'All invitations must be from the same category' },
        { status: 400 }
      );
    }

    // Process credit allocations
    const results = [];
    const errors = [];

    for (const invitation of invitations) {
      try {
        // Check if credits already allocated
        const { data: existingCredit, error: existingError } = await supabase
          .from('invitation_credits')
          .select('id, credits_allocated, credits_used')
          .eq('invitation_id', invitation.id)
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
              invitation_id: invitation.id,
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

        results.push({
          invitationId: invitation.id,
          invitationName: invitation.name,
          invitationEmail: invitation.email,
          creditsAllocated: creditRecord.credits_allocated,
          creditsUsed: creditRecord.credits_used,
          available: creditRecord.credits_allocated - creditRecord.credits_used
        });

      } catch (error) {
        errors.push({
          invitationId: invitation.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log the bulk credit allocation
    logger.info('Bulk credits allocated', {
      adminId: session.user.id,
      invitationCount: invitations.length,
      creditsPerInvitation: credits,
      reason,
      criteria,
      successCount: results.length,
      errorCount: errors.length
    });

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${credits} credits to ${results.length} invitations`,
      data: {
        results,
        errors,
        summary: {
          totalProcessed: invitations.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to bulk allocate credits', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 