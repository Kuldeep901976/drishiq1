import { logger } from '@/lib/logger';
import { OTPService } from '@/lib/otp-service';

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Rate limiting temporarily disabled for deployment

    const { phone, action, code, email, name } = await request.json();

    // Validation
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userEmail = email || session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (action === 'send') {
      // Send OTP via email for phone verification
      const result = await OTPService.sendOTP({
        email: userEmail,
        phone,
        name: name || session.user.user_metadata?.name || 'User',
        purpose: 'phone_verification',
        language: 'en'
      });

      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            retryAfter: result.retryAfter 
          },
          { status: result.retryAfter ? 429 : 400 }
        );
      }

      logger.info('Phone verification code sent', { email: userEmail, phone });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        method: 'email',
        expiresInMinutes: 10
      });
    }

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        );
      }

      // Verify OTP
      const result = await OTPService.verifyOTP({
        email: userEmail,
        code,
        purpose: 'phone_verification'
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Update user's phone number in our database
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', session.user.id);

      if (updateError) {
        logger.error('Error updating user phone');
        return NextResponse.json(
          { error: 'Failed to update phone number' },
          { status: 500 }
        );
      }

      logger.info('Phone verification successful', { email: userEmail, phone });

      return NextResponse.json({
        success: true,
        message: 'Phone verification successful',
        verified: true
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Phone verification failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 