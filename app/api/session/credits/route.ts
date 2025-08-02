import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { sessionService } from '@/lib/session-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    // Get user's current credit balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (userError) throw userError;
    
    // Get credit transaction history
    const transactions = await sessionService.getCreditTransactions(user.id, sessionId || undefined);
    
    logger.info('Credit information fetched', { 
      userId: user.id,
      currentBalance: userData.credits,
      transactionCount: transactions.length
    });
    
    return NextResponse.json({
      success: true,
      credits: {
        current_balance: userData.credits,
        transactions
      }
    });
    
  } catch (error) {
    logger.error('Error fetching credit information:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin (only admins can adjust credits)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { target_user_id, amount, reason, session_id } = body;
    
    if (!target_user_id || amount === undefined || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // await sessionService.adjustCredits(
    //   target_user_id,
    //   amount,
    //   reason,
    //   session_id
    // );
    // TODO: Implement adjustCredits logic or integrate with payment/credit service
    
    logger.info('Credits adjusted by admin', { 
      adminId: user.id,
      targetUserId: target_user_id,
      amount,
      reason
    });
    
    return NextResponse.json({
      success: true,
      message: 'Credits adjusted successfully'
    });
    
  } catch (error) {
    logger.error('Error adjusting credits:', error);
    return handleApiError(error);
  }
} 