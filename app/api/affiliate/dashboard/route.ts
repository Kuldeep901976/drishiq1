
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { ReferralService } from '../../../../lib/referral-service';



import { supabase } from '../../../../lib/supabase';
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
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select(`
        *,
        affiliate_programs (*)
      `)
      .eq('user_id', user.id);

    if (affiliatesError) {
      logger.error('Error getting affiliate accounts', affiliatesError, { userId: user.id });
      return NextResponse.json({ error: 'Failed to get affiliate accounts' }, { status: 500 });
    }

    // Get referral statistics
    const referralStats = await ReferralService.getUserReferralStats(user.id);

    // Get affiliate statistics for each affiliate account
    const affiliateStats = [];
    for (const affiliate of affiliates || []) {
      const stats = await ReferralService.getAffiliateStats(affiliate.id);
      affiliateStats.push({
        ...affiliate,
        stats
      });
    }

    // Get recent referrals
    const { data: recentReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        *,
        referee:users!referee_id (email, created_at)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (referralsError) {
      logger.error('Error getting recent referrals', referralsError, { userId: user.id });
    }

    // Get recent commissions
    const { data: recentCommissions, error: commissionsError } = await supabase
      .from('affiliate_commissions')
      .select(`
        *,
        affiliate:affiliates!affiliate_id (affiliate_code),
        referral:referrals!referral_id (
          referral_code,
          referee:users!referee_id (email)
        )
      `)
      .in('affiliate_id', (affiliates || []).map(a => a.id))
      .order('created_at', { ascending: false })
      .limit(10);

    if (commissionsError) {
      logger.error('Error getting recent commissions', commissionsError, { userId: user.id });
    }

    // Calculate total earnings across all affiliate accounts
    const totalEarnings = affiliates?.reduce((sum, affiliate) => sum + affiliate.total_earnings, 0) || 0;
    const totalPendingEarnings = affiliates?.reduce((sum, affiliate) => sum + affiliate.pending_earnings, 0) || 0;
    const totalPaidEarnings = affiliates?.reduce((sum, affiliate) => sum + affiliate.paid_earnings, 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        referralStats,
        affiliateStats,
        recentReferrals: recentReferrals || [],
        recentCommissions: recentCommissions || [],
        summary: {
          totalEarnings,
          totalPendingEarnings,
          totalPaidEarnings,
          totalReferrals: referralStats.totalReferrals,
          confirmedReferrals: referralStats.confirmedReferrals,
          activeAffiliateAccounts: affiliates?.filter(a => a.status === 'approved').length || 0
        }
      }
    });
  } catch (error) {
    logger.error('Error in affiliate dashboard API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to get affiliate dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 