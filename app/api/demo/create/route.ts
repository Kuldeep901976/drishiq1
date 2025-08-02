import { NextRequest, NextResponse } from 'next/server';
import { DemoService } from '../../../../lib/demo-service';
import { logger } from '../../../../lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      stakeholderType, 
      companyName, 
      title, 
      purpose, 
      demoCategoryId, 
      sessionDuration, 
      maxParticipants 
    } = await request.json();
    
    if (!email || !stakeholderType) {
      return NextResponse.json({ 
        error: 'Email and stakeholder type are required' 
      }, { status: 400 });
    }

    // Validate stakeholder type
    const validStakeholderTypes = ['investor', 'partner', 'customer', 'media', 'analyst', 'advisor', 'board_member', 'other'];
    if (!validStakeholderTypes.includes(stakeholderType)) {
      return NextResponse.json({ 
        error: 'Invalid stakeholder type' 
      }, { status: 400 });
    }

    // Create demo invitation
    const demoInvitationId = await DemoService.createDemoInvitation(
      email,
      stakeholderType,
      companyName,
      title,
      purpose,
      demoCategoryId,
      sessionDuration || 30,
      maxParticipants || 1
    );

    logger.info('Demo invitation created via API', { 
      email, 
      stakeholderType, 
      demoInvitationId 
    });

    return NextResponse.json({
      success: true,
      data: { demoInvitationId },
      message: 'Demo invitation created successfully'
    });
  } catch (error) {
    logger.error('Error creating demo invitation', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to create demo invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get demo categories
    const categories = await DemoService.getDemoCategories();

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error in demo categories API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to get demo categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 