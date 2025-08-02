import { logger } from '@/lib/logger';
import { OTPService } from '@/lib/otp-service';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { email, phone, name, action } = body;

    // Validation
    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Validate action
    const validActions = ['send_code', 'verify_code', 'resend_code'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (action === 'send_code' || action === 'resend_code') {
      // Send OTP via email (since SMS is not integrated yet)
      const result = await OTPService.sendOTP({
        email,
        phone,
        name: name || 'User',
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

      logger.info('Phone verification code sent via email', { email, phone });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        method: 'email',
        expiresInMinutes: 10
      });

    } else if (action === 'verify_code') {
      const { code } = body;

      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        );
      }

      // Verify OTP
      const result = await OTPService.verifyOTP({
        email,
        code,
        purpose: 'phone_verification'
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      logger.info('Phone verification successful', { email, phone });

      return NextResponse.json({
        success: true,
        message: 'Phone verification successful',
        verified: true
      });
    }

  } catch (error) {
    logger.error('Phone verification failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 