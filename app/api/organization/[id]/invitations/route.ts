import { enterpriseService } from '@/lib/enterprise-service';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to view invitations
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'view_invitations'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const invitations = await enterpriseService.getOrganizationInvitations(params.id);
    
    return NextResponse.json({
      success: true,
      invitations
    });
    
  } catch (error) {
    logger.error('Error fetching organization invitations:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to manage invitations
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_invitations'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, role, message, permissions, expires_in_days } = body;
    
    if (!email || !role) {
      return NextResponse.json({ 
        error: 'Email and role are required' 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Check if email is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', params.id)
      .eq('user_id', (
        await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()
      ).data?.id)
      .single();
    
    if (existingMember) {
      return NextResponse.json({ 
        error: 'User is already a member of this organization' 
      }, { status: 409 });
    }
    
    // Check organization limits
    const limits = await enterpriseService.checkOrganizationLimits(params.id);
    if (!limits.canAddUsers) {
      return NextResponse.json({ 
        error: `Organization has reached its user limit (${limits.maxUsers} users)` 
      }, { status: 400 });
    }
    
    const invitation = await enterpriseService.createInvitation({
      organization_id: params.id,
      email,
      role,
      message,
      permissions,
      invited_by: user.id,
      expires_in_days
    });
    
    logger.info('Invitation created successfully', { 
      organizationId: params.id,
      email,
      role,
      invitedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      invitation
    });
    
  } catch (error) {
    logger.error('Error creating invitation:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to manage invitations
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_invitations'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { invitation_id, action } = body;
    
    if (!invitation_id || !action) {
      return NextResponse.json({ 
        error: 'Invitation ID and action are required' 
      }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      case 'cancel':
        await enterpriseService.cancelInvitation(params.id, invitation_id);
        result = { success: true };
        break;
        
      case 'resend':
        result = await enterpriseService.resendInvitation(params.id, invitation_id);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    logger.info(`Invitation ${action} completed`, { 
      organizationId: params.id,
      invitationId: invitation_id,
      action,
      performedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Error managing invitation:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 