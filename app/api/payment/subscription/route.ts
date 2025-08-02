import { logger } from '@/lib/logger';
import { PaymentService } from '@/lib/payment-service';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const subscription = await PaymentService.getUserSubscription(userId);

    return NextResponse.json({ 
      success: true, 
      data: subscription 
    });
  } catch (error) {
    logger.error('Get subscription API error');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

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
    const { planId, regionCode, paymentMethodId } = body;

    if (!planId || !regionCode || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await PaymentService.createSubscription(
      userId,
      planId,
      regionCode,
      paymentMethodId
    );

    return NextResponse.json({ 
      success: true, 
      data: subscription 
    });
  } catch (error) {
    logger.error('Create subscription API error');
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

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
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    // Cancel subscription
    const result = await PaymentService.cancelSubscription(userId, subscriptionId);

    return NextResponse.json({ 
      success: true, 
      data: { canceled: result } 
    });
  } catch (error) {
    logger.error('Cancel subscription API error');
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 