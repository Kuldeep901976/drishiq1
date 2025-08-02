import { logger } from '@/lib/logger';
import { OTPService } from '@/lib/otp-service';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { email, phone, name, purpose, language } = body;

    // Validation
    if (!email || !purpose) {
      return NextResponse.json(
        { error: 'Email and purpose are required' },
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

    // Validate purpose
    const validPurposes = ['phone_verification', 'email_verification', 'password_reset'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    // Send OTP
    const result = await OTPService.sendOTP({
      email,
      phone,
      name: name || 'User',
      purpose,
      language: language || 'en'
    });

    if (!result.success) {
      if (result.retryAfter) {
        return NextResponse.json(
          { 
            error: result.error,
            retryAfter: result.retryAfter 
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    logger.info('OTP sent successfully', { email, purpose });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresInMinutes: 10
    });

  } catch (error) {
    logger.error('Failed to send OTP');
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