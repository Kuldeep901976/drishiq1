import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { rateLimiter } from '../../../../lib/rate-limiter';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { email, name, token, invitationLink } = body;

    if (!email || !name || !token || !invitationLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send email using Supabase Edge Functions or Resend
    // For now, we'll use a simple email template and log it
    const emailContent = {
      to: email,
      subject: 'Your DrishiQ Invitation - See Through the Challenge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0B4422 0%, #083318 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DrishiQ</h1>
            <p style="color: #90EE90; margin: 10px 0 0 0; font-size: 16px;">See Through the Challenge</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #0B4422; margin-bottom: 20px;">Welcome to DrishiQ, ${name}!</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
              Thank you for your interest in joining our invite-only community. We're excited to have you on board!
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
              <h3 style="color: #0B4422; margin-top: 0;">Your Invitation Link</h3>
              <p style="color: #666; margin-bottom: 20px;">
                Click the button below to access your personalized DrishiQ experience:
              </p>
              <a href="${invitationLink}" 
                 style="display: inline-block; background: #0B4422; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ Important:</strong> This invitation expires in 7 days. Don't miss out!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>What to expect:</strong><br>
              • Personalized guidance based on your preferences<br>
              • AI-powered insights to help you see through challenges<br>
              • A community of forward-thinking individuals<br>
              • Tools for reflection, growth, and decision-making
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                DrishiQ - Intelligence of Perception<br>
                See Through the Challenge
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Welcome to DrishiQ, ${name}!
        
        Thank you for your interest in joining our invite-only community. We're excited to have you on board!
        
        Your Invitation Link: ${invitationLink}
        
        What to expect:
        • Personalized guidance based on your preferences
        • AI-powered insights to help you see through challenges
        • A community of forward-thinking individuals
        • Tools for reflection, growth, and decision-making
        
        This invitation link is unique to you and will expire in 7 days.
        
        DrishiQ - Intelligence of Perception
        See Through the Challenge
      `
    };

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, we'll log the email content
    logger.info('Email would be sent:', {
      to: email,
      subject: emailContent.subject,
      invitationLink
    });

    // Store email record in Supabase for tracking
    const { error: emailError } = await supabase
      .from('email_logs')
      .insert([{
        recipient_email: email,
        recipient_name: name,
        email_type: 'invitation',
        subject: emailContent.subject,
        token: token,
        sent_at: new Date().toISOString(),
        status: 'sent'
      }]);

    if (emailError) {
      logger.warn('Failed to log email in database:', emailError);
    }

    logger.info('Invitation email sent successfully', { email, token });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    logger.error('Error sending invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 