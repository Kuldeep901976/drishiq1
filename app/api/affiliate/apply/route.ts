
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { ReferralService } from '../../../../lib/referral-service';

import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { programId, paymentMethod, paymentDetails } = await request.json();
      
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

      // Check if user already has an affiliate account for this program
      const { data: existingAffiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .single();

      if (existingAffiliate) {
        return NextResponse.json({
          error: 'You already have an affiliate account for this program',
          data: existingAffiliate
        }, { status: 400 });
      }

      // Apply for affiliate program
      const affiliate = await ReferralService.applyForAffiliateProgram(
        user.id,
        programId,
        paymentMethod,
        paymentDetails
      );

      logger.info('Affiliate application submitted via API', { 
        userId: user.id, 
        programId,
        affiliateId: affiliate.id
      });

      return NextResponse.json({
        success: true,
        data: affiliate,
        message: 'Affiliate application submitted successfully'
      });
  } catch (error) {
    logger.error('Error in affiliate application API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to submit affiliate application',
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

      // Get user's affiliate accounts
      const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          affiliate_programs (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting affiliates', error, { userId: user.id });
        return NextResponse.json({ error: 'Failed to get affiliate accounts' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: affiliates || []
      });
  } catch (error) {
    logger.error('Error in affiliate accounts API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to get affiliate accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 