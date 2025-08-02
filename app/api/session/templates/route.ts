import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { sessionService } from '@/lib/session-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const templates = await sessionService.getSessionTypes();
    
    logger.info('Session templates fetched', { 
      count: templates.length 
    });
    
    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Error fetching session templates:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, duration_minutes, credit_cost, description, features } = body;
    
    if (!name || !type || !duration_minutes || credit_cost === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // This would require admin permissions in a real implementation
    // For now, we'll just return an error
    return NextResponse.json({ 
      error: 'Template creation requires admin privileges' 
    }, { status: 403 });
    
  } catch (error) {
    logger.error('Error creating session template:', error);
    return handleApiError(error);
  }
} 