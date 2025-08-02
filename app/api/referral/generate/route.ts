
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { ReferralService } from '../../../../lib/referral-service';



import { supabase } from '../../../../lib/supabase';
export async function POST(request: NextRequest) {
  try {
    const { type, maxUses, expiresAt } = await request.json();
    
    // Get user from auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    // Generate referral code
    const referralCode = await ReferralService.generateReferralCode(
      user.id,
      type || 'user',
      maxUses,
      expiresAt ? new Date(expiresAt) : undefined
    );

    logger.info('Referral code generated via API', { userId: user.id, code: referralCode.code });

    return NextResponse.json({
      success: true,
      data: referralCode
    });
  } catch (error) {
    logger.error('Error in referral generation API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to generate referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    // Get user's referral codes
    const { data: codes, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting referral codes', { error, userId: user.id });
      return NextResponse.json({ error: 'Failed to get referral codes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: codes || []
    });
  } catch (error) {
    logger.error('Error in referral codes API', { error });
    return NextResponse.json({
      error: 'Failed to get referral codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 