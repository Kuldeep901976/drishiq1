import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { ReferralService } from '../../../../lib/referral-service';

export async function GET(request: NextRequest) {
  try {
    // Get all active affiliate programs
    const programs = await ReferralService.getAffiliatePrograms();

    return NextResponse.json({
      success: true,
      data: programs
    });
  } catch (error) {
    logger.error('Error in affiliate programs API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to get affiliate programs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 