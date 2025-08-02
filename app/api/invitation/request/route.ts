import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '../../../../lib/invitation-service';
import { logger } from '../../../../lib/logger';
import { withRateLimit } from '../../../../lib/rate-limiter';

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const { email, fullName, language, interests, issues } = body;
      if (!email || !fullName || !language || !interests || !issues) {
        return NextResponse.json(
          { error: 'Email, name, language, interests, and issues are required' },
          { status: 400 }
        );
      }

      // Extract UTM parameters and referrer from headers
      const utmSource = request.nextUrl.searchParams.get('utm_source') || body.utmSource;
      const utmMedium = request.nextUrl.searchParams.get('utm_medium') || body.utmMedium;
      const utmCampaign = request.nextUrl.searchParams.get('utm_campaign') || body.utmCampaign;
      const referrer = request.headers.get('referer') || body.referrer;

      // Submit invitation request
      const result = await InvitationService.submitInvitationRequest({
        email,
        phone: body.phone,
        fullName,
        language,
        interests: Array.isArray(interests) ? interests : [interests],
        issues: Array.isArray(issues) ? issues : [issues],
        utmSource,
        utmMedium,
        utmCampaign,
        referrer
      });

      if (!result.success) {
        logger.warn('Failed to submit invitation request', { email, error: result.error });
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        autoApproved: result.autoApproved,
        message: result.autoApproved 
          ? 'Your invitation request has been approved! Check your email for the invitation link.'
          : 'Your invitation request has been submitted. We will review it and get back to you soon.'
      });

    } catch (error) {
      logger.error('Error in invitation request endpoint');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
} 