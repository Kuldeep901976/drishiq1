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
    
    // Check if user has permission to view members
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'view_members'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const members = await enterpriseService.getOrganizationMembers(params.id);
    
    return NextResponse.json({
      success: true,
      members
    });
    
  } catch (error) {
    logger.error('Error fetching organization members:', error instanceof Error ? error : new Error(String(error)));
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
    
    // Check if user has permission to manage members
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_members'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { member_id, action, role, permissions } = body;
    
    if (!member_id || !action) {
      return NextResponse.json({ 
        error: 'Member ID and action are required' 
      }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      case 'update_role':
        if (!role) {
          return NextResponse.json({ 
            error: 'Role is required for update_role action' 
          }, { status: 400 });
        }
        result = await enterpriseService.updateMemberRole(
          params.id,
          member_id,
          role,
          permissions
        );
        break;
        
      case 'deactivate':
        result = await enterpriseService.deactivateMember(params.id, member_id);
        break;
        
      case 'remove':
        await enterpriseService.removeMember(params.id, member_id);
        result = { success: true };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    logger.info(`Member ${action} completed`, { 
      organizationId: params.id,
      memberId: member_id,
      action,
      performedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Error managing organization member:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 