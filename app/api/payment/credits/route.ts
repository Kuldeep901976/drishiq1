import { logger } from '@/lib/logger';
import { PaymentService } from '@/lib/payment-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'balance') {
      // Get credit balance
      const balance = await PaymentService.getCreditBalance(userId);
      return NextResponse.json({ 
        success: true, 
        data: balance 
      });
    } else if (action === 'transactions') {
      // Get credit transactions
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return NextResponse.json({ 
        success: true, 
        data: transactions 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Get credits API error');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, packageId, regionCode, paymentMethodId, sessionId, amount } = body;

    if (action === 'purchase') {
      // Purchase credits
      if (!packageId || !regionCode || !paymentMethodId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const transaction = await PaymentService.purchaseCredits(
        userId,
        packageId,
        regionCode,
        paymentMethodId
      );

      return NextResponse.json({ 
        success: true, 
        data: transaction 
      });
    } else if (action === 'reserve') {
      // Reserve credits for session
      if (!sessionId || !amount) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const result = await PaymentService.reserveCredits(
        userId,
        sessionId,
        amount,
        body.sessionType
      );

      return NextResponse.json({ 
        success: true, 
        data: { reserved: result } 
      });
    } else if (action === 'complete') {
      // Complete session and deduct credits
      if (!sessionId || amount === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const result = await PaymentService.completeSession(
        userId,
        sessionId,
        amount
      );

      return NextResponse.json({ 
        success: true, 
        data: { completed: result } 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Credits API error');
    return NextResponse.json(
      { success: false, error: 'Failed to process credit operation' },
      { status: 500 }
    );
  }
} 