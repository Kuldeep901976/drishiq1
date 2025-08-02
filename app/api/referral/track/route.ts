
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { ReferralService } from '../../../../lib/referral-service';



import { supabase } from '../../../../lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { referralCode, userId, conversionEvent } = await request.json();
    
    if (!referralCode || !userId) {
      return NextResponse.json({ 
        error: 'Referral code and user ID are required' 
      }, { status: 400 });
    }

    // Track the referral
    const referral = await ReferralService.trackReferral(
      referralCode,
      userId,
      conversionEvent || 'signup'
    );

    logger.info('Referral tracked via API', { 
      referralCode, 
      userId, 
      conversionEvent,
      referralId: referral.id 
    });

    return NextResponse.json({
      success: true,
      data: referral,
      message: 'Referral tracked successfully'
    });
  } catch (error) {
    logger.error('Error in referral tracking API', { error });
    return NextResponse.json({
      error: 'Failed to track referral',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ 
        error: 'Referral code is required' 
      }, { status: 400 });
    }

    // Validate the referral code
    const validation = await ReferralService.validateReferralCode(code);

    return NextResponse.json({
      success: true,
      data: {
        valid: validation.valid,
        reason: validation.reason,
        referralCode: validation.referralCode
      }
    });
  } catch (error) {
    logger.error('Error in referral validation API', { error });
    return NextResponse.json({
      error: 'Failed to validate referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 