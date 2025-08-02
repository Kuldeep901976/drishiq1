import { AnalyticsService } from '@/lib/analytics-service';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventName, pageUrl, pageTitle, elementId, elementClass, elementText, properties } = body;

    if (!eventType || !eventName) {
      return NextResponse.json(
        { error: 'Event type and name are required' },
        { status: 400 }
      );
    }

    await AnalyticsService.trackEvent({
      eventType,
      eventName,
      pageUrl,
      pageTitle,
      elementId,
      elementClass,
      elementText,
      properties
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Analytics tracking API error');
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

    switch (action) {
      case 'session':
        const sessionId = await AnalyticsService.initializeSession();
        return NextResponse.json({ sessionId });

      case 'page-view':
        const pageUrl = searchParams.get('pageUrl');
        const pageTitle = searchParams.get('pageTitle');
        await AnalyticsService.trackPageView(pageUrl || undefined, pageTitle || undefined);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Analytics GET API error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 