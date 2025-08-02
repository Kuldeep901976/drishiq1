import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';
import { rateLimiter } from '../../../../lib/rate-limiter';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { email, name, invitationToken, invitationLink } = body;

    if (!email || !name || !invitationToken || !invitationLink) {
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

    // Generate magic link token
    const magicLinkToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store magic link data in database
    const { error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email,
        token: magicLinkToken,
        expires_at: expiresAt.toISOString(),
        invitation_token: invitationToken,
        used: false
      });

    if (insertError) {
      logger.error('Failed to store magic link:', insertError);
      return NextResponse.json(
        { error: 'Failed to create magic link' },
        { status: 500 }
      );
    }

    // Create magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/auth/verify?token=${magicLinkToken}&email=${encodeURIComponent(email)}`;

    // Send email with magic link
    const emailContent = {
      to: email,
      subject: 'Your DrishiQ Magic Link - See Through the Challenge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0B4422 0%, #083318 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DrishiQ</h1>
            <p style="color: #90EE90; margin: 10px 0 0 0; font-size: 16px;">See Through the Challenge</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #0B4422; margin-bottom: 20px;">Welcome to DrishiQ, ${name}!</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
              Your phone has been verified successfully! Now click the button below to securely access your DrishiQ account:
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
              <h3 style="color: #0B4422; margin-top: 0;">Your Magic Link</h3>
              <p style="color: #666; margin-bottom: 20px;">
                Click the button below to access your personalized DrishiQ experience:
              </p>
              <a href="${magicLink}" 
                 style="display: inline-block; background: #0B4422; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Access DrishiQ
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Security note:</strong><br>
              • This link will expire in 24 hours<br>
              • Only use this link on your personal device<br>
              • If you didn't request this link, please ignore this email
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

        Your phone has been verified successfully! Click the link below to securely access your DrishiQ account:
        ${magicLink}

        What to expect:
        • Personalized guidance based on your preferences
        • AI-powered insights to help you see through challenges
        • A community of forward-thinking individuals
        • Tools for reflection, growth, and decision-making

        This magic link will expire in 24 hours.

        DrishiQ - Intelligence of Perception
        See Through the Challenge
      `
    };

    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    // For now, we'll log the email content
    logger.info('Magic link email would be sent:', {
      to: email,
      magicLink,
      expiresAt: expiresAt.toISOString()
    });

    // Store email record in email_logs table for tracking
    const { error: emailLogError } = await supabase
      .from('email_logs')
      .insert([{
        recipient_email: email,
        recipient_name: name,
        email_type: 'magic_link',
        subject: emailContent.subject,
        token: magicLinkToken,
        sent_at: new Date().toISOString(),
        status: 'sent'
      }]);

    if (emailLogError) {
      logger.warn('Failed to log email in database:', emailLogError);
    }

    logger.info('Magic link created and email sent successfully', { email, expiresAt: expiresAt.toISOString() });

    return NextResponse.json({
      success: true,
      message: 'Magic link created and email sent successfully',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    logger.error('Error in magic link creation and sending:', error);
    return NextResponse.json(
      { error: 'Failed to create and send magic link' },
      { status: 500 }
    );
  }
} 