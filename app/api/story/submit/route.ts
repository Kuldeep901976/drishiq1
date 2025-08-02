import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { withRateLimit } from '../../../../lib/rate-limiter';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const { email, fullName, language, storyTitle, storyContent } = body;
      if (!email || !fullName || !language || !storyTitle || !storyContent) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }

      // Basic uniqueness scoring (simplified)
      const uniquenessScore = Math.min(
        Math.floor(storyContent.length / 50) + 
        (storyTitle.length > 30 ? 10 : 0) + 
        (storyContent.split(' ').length > 100 ? 15 : 0), 
        100
      );

      // Insert story into database
      const { data: story, error } = await supabase
        .from('stories')
        .insert([{
          email,
          phone: body.phone,
          full_name: fullName,
          language,
          story_title: storyTitle,
          story_content: storyContent,
          category: body.category,
          urgency_level: body.urgencyLevel || 'medium',
          uniqueness_score: uniquenessScore,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to submit story');
        return NextResponse.json(
          { error: 'Failed to submit story' },
          { status: 500 }
        );
      }

      logger.info('Story submitted successfully');

      return NextResponse.json({
        success: true,
        message: 'Your story has been submitted successfully! We will review it and get back to you soon.',
        storyId: story.id,
        uniquenessScore
      });

    } catch (error) {
      logger.error('Error in story submission endpoint');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
} 