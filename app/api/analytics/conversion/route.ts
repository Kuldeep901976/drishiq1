import { AnalyticsService } from '@/lib/analytics-service';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversionType, conversionValue, metadata, userId, testName } = body;

    if (!conversionType) {
      return NextResponse.json(
        { error: 'Conversion type is required' },
        { status: 400 }
      );
    }

    // Track conversion
    await AnalyticsService.trackConversion({
      conversionType,
      conversionValue,
      metadata
    });

    // Track A/B test conversion if test name provided
    if (testName) {
      await AnalyticsService.trackABTestConversion(testName, userId, conversionValue);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Conversion tracking API error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const testName = searchParams.get('testName');
    const userId = searchParams.get('userId');

    if (action === 'ab-test-variant' && testName) {
      const variant = await AnalyticsService.initializeABTest(testName, userId || undefined);
      return NextResponse.json({ variant });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Conversion GET API error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 