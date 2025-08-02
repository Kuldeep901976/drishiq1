import { AdminService } from '@/lib/admin-service';
import { logger } from '@/lib/logger';

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Build query
    let query = supabase
      .from('Invitation')
      .select(`
        *,
        credits:invitation_credits(
          id,
          credits_allocated,
          credits_used,
          status
        ),
        testimonial:testimonials(
          id,
          content,
          rating,
          approved,
          published,
          user_consent,
          consent_date,
          admin_notes,
          created_at
        )
      `)
      .eq('category', 'testimonial')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      if (status === 'pending_approval') {
        query = query.eq('testimonial.approved', false);
      } else if (status === 'approved') {
        query = query.eq('testimonial.approved', true);
      } else if (status === 'published') {
        query = query.eq('testimonial.published', true);
      } else if (status === 'needs_consent') {
        query = query.eq('testimonial.user_consent', false);
      }
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: testimonials, error } = await query;

    if (error) throw error;

    // Transform data for frontend
    const transformedTestimonials = testimonials?.map(invitation => ({
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      phone: invitation.phone,
      language: invitation.language,
      location: invitation.location,
      challenge: invitation.challenge,
      challenge_description: invitation.challenge_description,
      status: invitation.status,
      created_at: invitation.created_at,
      credits_allocated: invitation.credits?.[0]?.credits_allocated || 0,
      credits_used: invitation.credits?.[0]?.credits_used || 0,
      testimonial: invitation.testimonial?.[0] || null
    })) || [];

    logger.info('Testimonials retrieved', { 
      adminId: session.user.id, 
      status, 
      count: transformedTestimonials.length 
    });

    return NextResponse.json({
      success: true,
      data: transformedTestimonials,
      pagination: {
        page,
        limit,
        total: transformedTestimonials.length
      }
    });

  } catch (error) {
    logger.error('Failed to get testimonials', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      action, 
      invitationId, 
      testimonialId, 
      content, 
      rating, 
      adminNotes,
      sendConsentEmail 
    } = body;

    if (!action || !invitationId) {
      return NextResponse.json(
        { error: 'Action and invitation ID are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create_testimonial':
        // Create new testimonial
        const { data: newTestimonial, error: createError } = await supabase
          .from('testimonials')
          .insert({
            invitation_id: invitationId,
            content: content,
            rating: rating || 5,
            approved: false,
            published: false,
            user_consent: false,
            admin_notes: adminNotes || '',
            created_by: session.user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        result = newTestimonial;
        break;

      case 'approve_testimonial':
        // Approve testimonial
        const { data: approvedTestimonial, error: approveError } = await supabase
          .from('testimonials')
          .update({
            approved: true,
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
            updated_by: session.user.id
          })
          .eq('id', testimonialId)
          .select()
          .single();

        if (approveError) throw approveError;
        result = approvedTestimonial;
        break;

      case 'publish_testimonial':
        // Publish testimonial (requires user consent)
        const { data: existingTestimonial, error: fetchError } = await supabase
          .from('testimonials')
          .select('user_consent, approved')
          .eq('id', testimonialId)
          .single();

        if (fetchError) throw fetchError;

        if (!existingTestimonial.approved) {
          return NextResponse.json(
            { error: 'Testimonial must be approved before publishing' },
            { status: 400 }
          );
        }

        if (!existingTestimonial.user_consent) {
          return NextResponse.json(
            { error: 'User consent required before publishing' },
            { status: 400 }
          );
        }

        const { data: publishedTestimonial, error: publishError } = await supabase
          .from('testimonials')
          .update({
            published: true,
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
            updated_by: session.user.id
          })
          .eq('id', testimonialId)
          .select()
          .single();

        if (publishError) throw publishError;
        result = publishedTestimonial;
        break;

      case 'request_consent':
        // Send consent request email
        if (sendConsentEmail) {
          // TODO: Implement email sending logic
          logger.info('Consent email requested', { 
            adminId: session.user.id, 
            testimonialId 
          });
        }

        const { data: consentRequested, error: consentError } = await supabase
          .from('testimonials')
          .update({
            consent_requested: true,
            consent_request_date: new Date().toISOString(),
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
            updated_by: session.user.id
          })
          .eq('id', testimonialId)
          .select()
          .single();

        if (consentError) throw consentError;
        result = consentRequested;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    logger.info('Testimonial action performed', {
      adminId: session.user.id,
      action,
      invitationId,
      testimonialId: result?.id
    });

    return NextResponse.json({
      success: true,
      message: `Testimonial ${action} successful`,
      data: result
    });

  } catch (error) {
    logger.error('Failed to perform testimonial action', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 