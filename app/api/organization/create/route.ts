import { enterpriseService } from '@/lib/enterprise-service';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, slug, description, industry, size, contact_email } = body;
    
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Organization name and slug are required' 
      }, { status: 400 });
    }
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
      }, { status: 400 });
    }
    
    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existingOrg) {
      return NextResponse.json({ 
        error: 'Organization slug is already taken' 
      }, { status: 409 });
    }
    
    const organization = await enterpriseService.createOrganization({
      name,
      slug,
      description,
      industry,
      size,
      contact_email,
      owner_id: user.id
    });
    
    logger.info('Organization created successfully', { 
      organizationId: organization.id,
      name: organization.name,
      ownerId: user.id
    });
    
    return NextResponse.json({
      success: true,
      organization
    });
    
  } catch (error) {
    logger.error('Error creating organization:', error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 