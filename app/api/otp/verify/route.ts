import { logger } from '@/lib/logger';
import { OTPService } from '@/lib/otp-service';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { email, code, purpose } = body;

    // Validation
    if (!email || !code || !purpose) {
      return NextResponse.json(
        { error: 'Email, code, and purpose are required' },
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

    // Validate code format (6 digits)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Code must be 6 digits' },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ['phone_verification', 'email_verification', 'password_reset'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await OTPService.verifyOTP({
      email,
      code,
      purpose
    });

    if (!result.success) {
      logger.warn('OTP verification failed', { email, purpose });
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    logger.info('OTP verified successfully', { email, purpose });

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      verified: true
    });

  } catch (error) {
    logger.error('Failed to verify OTP');
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