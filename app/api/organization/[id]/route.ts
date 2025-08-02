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
    
    const organization = await enterpriseService.getOrganization(params.id);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Check if user has access to this organization
    const hasAccess = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'view_organization'
    );
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      organization
    });
    
  } catch (error) {
    logger.error('Error fetching organization:', error instanceof Error ? error : new Error(String(error)));
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
    
    // Check if user has permission to update organization
    const hasPermission = await enterpriseService.hasPermission(
      user.id,
      params.id,
      'manage_organization'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description, industry, size, contact_email, contact_phone, website, settings } = body;
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (industry !== undefined) updates.industry = industry;
    if (size !== undefined) updates.size = size;
    if (contact_email !== undefined) updates.contact_email = contact_email;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone;
    if (website !== undefined) updates.website = website;
    if (settings !== undefined) updates.settings = settings;
    
    const organization = await enterpriseService.updateOrganization(params.id, updates);
    
    logger.info('Organization updated successfully', { 
      organizationId: params.id,
      updatedBy: user.id,
      updates: Object.keys(updates)
    });
    
    return NextResponse.json({
      success: true,
      organization
    });
    
  } catch (error) {
    logger.error('Error updating organization:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is owner
    const userRole = await enterpriseService.getUserRole(user.id, params.id);
    
    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can delete organizations' }, { status: 403 });
    }
    
    // Update organization status to cancelled instead of deleting
    await enterpriseService.updateOrganization(params.id, {
      status: 'cancelled'
    });
    
    logger.info('Organization deleted', { 
      organizationId: params.id,
      deletedBy: user.id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting organization:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 