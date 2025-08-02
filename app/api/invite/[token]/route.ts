import { enterpriseService } from '@/lib/enterprise-service';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    
    // Get invitation details without authentication
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organization:organizations(name, slug),
        invited_by_user:users!organization_invitations_invited_by_fkey(name, email)
      `)
      .eq('token', params.token)
      .eq('status', 'pending')
      .single();
    
    if (error || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation' 
      }, { status: 404 });
    }
    
    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 410 });
    }
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        organization: invitation.organization,
        invited_by: invitation.invited_by_user,
        expires_at: invitation.expires_at
      }
    });
    
  } catch (error) {
    logger.error('Error fetching invitation:', error as Error);
    return handleApiError(error as Error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'accept') {
      const result = await enterpriseService.acceptInvitation(params.token, user.id);
      
      if (result.success) {
        logger.info('Invitation accepted successfully', { 
          token: params.token,
          userId: user.id
        });
        
        return NextResponse.json({
          success: true,
          message: 'Invitation accepted successfully'
        });
      } else {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 400 });
      }
    } else if (action === 'decline') {
      // Update invitation status to declined
      const { error } = await supabase
        .from('organization_invitations')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('token', params.token);
      
      if (error) throw error;
      
      logger.info('Invitation declined', { 
        token: params.token,
        userId: user.id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept" or "decline"' 
      }, { status: 400 });
    }
    
  } catch (error) {
    logger.error('Error processing invitation:', error as Error);
    return handleApiError(error as Error);
  }
} 