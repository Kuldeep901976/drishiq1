import { logger } from './logger';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface InvitationEmailData {
  recipientName: string;
  recipientEmail: string;
  invitationToken: string;
  expiresAt: Date;
  inviterName?: string;
  language?: string;
}

export interface OTPEmailData {
  recipientName: string;
  recipientEmail: string;
  otpCode: string;
  expiresInMinutes: number;
  purpose: 'phone_verification' | 'email_verification' | 'password_reset';
}

export interface StoryStatusEmailData {
  recipientName: string;
  recipientEmail: string;
  storyTitle: string;
  status: 'approved' | 'rejected' | 'published';
  adminNotes?: string;
  invitationToken?: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@drishiq.com';
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://drishiq.com';

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.getInvitationTemplate(data);
      
      // In production, integrate with email service like SendGrid, AWS SES, etc.
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      // For now, log the email (replace with actual email sending)
      logger.info('Sending invitation email', { 
        to: data.recipientEmail, 
        subject: template.subject 
      });

      // TODO: Integrate with actual email service
      const success = await this.sendEmail(emailData);
      
      return { success };
    } catch (error) {
      logger.error('Failed to send invitation email');
      return { success: false, error: 'Email sending failed' };
    }
  }

  /**
   * Send OTP email
   */
  static async sendOTPEmail(data: OTPEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.getOTPTemplate(data);
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      logger.info('Sending OTP email', { 
        to: data.recipientEmail, 
        purpose: data.purpose 
      });

      const success = await this.sendEmail(emailData);
      
      return { success };
    } catch (error) {
      logger.error('Failed to send OTP email');
      return { success: false, error: 'Email sending failed' };
    }
  }

  /**
   * Send story status notification email
   */
  static async sendStoryStatusEmail(data: StoryStatusEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.getStoryStatusTemplate(data);
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      logger.info('Sending story status email', { 
        to: data.recipientEmail, 
        status: data.status 
      });

      const success = await this.sendEmail(emailData);
      
      return { success };
    } catch (error) {
      logger.error('Failed to send story status email');
      return { success: false, error: 'Email sending failed' };
    }
  }

  /**
   * Send magic link invitation email
   */
  public static async sendMagicLink(recipientEmail: string, invitationToken: string, recipientName: string): Promise<{ success: boolean; error?: string }> {
    // Use a 7-day expiry for the invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return this.sendInvitationEmail({
      recipientName,
      recipientEmail,
      invitationToken,
      expiresAt
    });
  }

  /**
   * Generate invitation email template
   */
  private static getInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const invitationUrl = `${this.BASE_URL}/invitation/${data.invitationToken}`;
    const expiresDate = data.expiresAt.toLocaleDateString();
    
    const subject = `🎉 You're Invited to DrishiQ - Your Gateway to Intelligent Perception`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DrishiQ Invitation</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0B4422 0%, #2d7a3e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 40px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
          .btn { display: inline-block; padding: 15px 30px; background: #0B4422; color: white; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; }
          .btn:hover { background: #063015; }
          .highlight { background: #f0f9f4; padding: 15px; border-left: 4px solid #0B4422; margin: 20px 0; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .tagline { font-size: 16px; opacity: 0.9; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DrishiQ</div>
            <div class="tagline">See Through the Challenge</div>
            <div style="font-size: 14px; margin-top: 10px;">Intelligence of Perception</div>
          </div>
          
          <div class="content">
            <h2 style="color: #0B4422; margin-bottom: 20px;">Welcome to DrishiQ, ${data.recipientName}! 🎉</h2>
            
            <p>You've been invited to join <strong>DrishiQ</strong> - an exclusive, invitation-based platform that helps you gain clarity and make better decisions through the power of intelligent perception.</p>
            
            <div class="highlight">
              <h3 style="margin-top: 0; color: #0B4422;">What makes DrishiQ special?</h3>
              <ul style="margin-bottom: 0;">
                <li><strong>🧠 AI-Powered Insights:</strong> Get intelligent analysis for complex situations</li>
                <li><strong>👥 Exclusive Community:</strong> Join curated group of forward-thinking individuals</li>
                <li><strong>⚡ Rapid Results:</strong> Quick, actionable solutions to your challenges</li>
                <li><strong>🌍 Multi-Language Support:</strong> Available in 17+ languages</li>
              </ul>
            </div>
            
            <p><strong>Your invitation is ready!</strong> Click the button below to get started:</p>
            
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="btn">Accept Invitation & Get Started</a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong> This invitation expires on <strong>${expiresDate}</strong>. Don't miss out!</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">${invitationUrl}</p>
            
            <p>Questions? Need help? Our support team is here for you at <a href="mailto:support@drishiq.com" style="color: #0B4422;">support@drishiq.com</a></p>
            
            <p style="margin-top: 30px;">
              Welcome aboard!<br>
              <strong>The DrishiQ Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 DrishiQ. All rights reserved.</p>
            <p>See Through the Challenge - Intelligence of Perception</p>
            <p>If you didn't request this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to DrishiQ, ${data.recipientName}!
      
      You've been invited to join DrishiQ - an exclusive, invitation-based platform for intelligent perception and better decision making.
      
      Your invitation link: ${invitationUrl}
      
      This invitation expires on ${expiresDate}.
      
      Questions? Contact us at support@drishiq.com
      
      Welcome aboard!
      The DrishiQ Team
    `;

    return { subject, html, text };
  }

  /**
   * Generate OTP email template
   */
  private static getOTPTemplate(data: OTPEmailData): EmailTemplate {
    const purposeMap = {
      phone_verification: 'Phone Verification',
      email_verification: 'Email Verification', 
      password_reset: 'Password Reset'
    };

    const subject = `🔐 Your DrishiQ ${purposeMap[data.purpose]} Code: ${data.otpCode}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DrishiQ Verification Code</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 0 auto; padding: 20px; }
          .header { background: #0B4422; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
          .otp-code { font-size: 36px; font-weight: bold; color: #0B4422; text-align: center; letter-spacing: 8px; background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px dashed #0B4422; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">DrishiQ</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Verification Code</p>
          </div>
          
          <div class="content">
            <h3 style="color: #0B4422;">Hello ${data.recipientName},</h3>
            
            <p>Your ${purposeMap[data.purpose].toLowerCase()} code for DrishiQ is:</p>
            
            <div class="otp-code">${data.otpCode}</div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⏰ This code expires in ${data.expiresInMinutes} minutes.</strong></p>
            </div>
            
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>Never share this code with anyone</li>
              <li>DrishiQ will never ask for this code via phone or email</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
            
            <p>Need help? Contact us at <a href="mailto:support@drishiq.com" style="color: #0B4422;">support@drishiq.com</a></p>
          </div>
          
          <div class="footer">
            <p>© 2025 DrishiQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      DrishiQ ${purposeMap[data.purpose]} Code
      
      Hello ${data.recipientName},
      
      Your verification code is: ${data.otpCode}
      
      This code expires in ${data.expiresInMinutes} minutes.
      
      Never share this code with anyone.
      
      Need help? Contact support@drishiq.com
    `;

    return { subject, html, text };
  }

  /**
   * Generate story status email template
   */
  private static getStoryStatusTemplate(data: StoryStatusEmailData): EmailTemplate {
    const statusMap = {
      approved: { emoji: '✅', title: 'Story Approved!', color: '#10b981' },
      rejected: { emoji: '❌', title: 'Story Update', color: '#ef4444' },
      published: { emoji: '🎉', title: 'Story Published!', color: '#0B4422' }
    };

    const statusInfo = statusMap[data.status];
    const subject = `${statusInfo.emoji} ${statusInfo.title} - "${data.storyTitle}"`;
    
    let content = '';
    if (data.status === 'approved') {
      content = `
        <p>Great news! Your story "<strong>${data.storyTitle}</strong>" has been approved by our team.</p>
        ${data.invitationToken ? `
        <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
          <h3 style="margin: 0 0 10px 0;">🎁 Bonus: You've earned an invitation!</h3>
          <p style="margin: 0;">As a thank you for sharing your story, you've received a special invitation to DrishiQ!</p>
        </div>
        ` : ''}
      `;
    } else if (data.status === 'published') {
      content = `
        <p>Congratulations! Your story "<strong>${data.storyTitle}</strong>" is now live on DrishiQ and helping others learn from your experience.</p>
        ${data.invitationToken ? `
        <div style="background: #0B4422; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
          <h3 style="margin: 0 0 10px 0;">🎁 Special Reward: Free Session Invitation!</h3>
          <p style="margin: 0;">Your published story has earned you a free session invitation to DrishiQ!</p>
        </div>
        ` : ''}
      `;
    } else {
      content = `
        <p>Thank you for submitting your story "<strong>${data.storyTitle}</strong>" to DrishiQ.</p>
        <p>After careful review, we've decided not to move forward with this particular story at this time.</p>
        ${data.adminNotes ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Feedback:</strong> ${data.adminNotes}</p>
        </div>
        ` : ''}
        <p>We encourage you to submit another story in the future. Every story helps us understand the challenges people face.</p>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DrishiQ Story Update</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusInfo.color}; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
          .btn { display: inline-block; padding: 15px 30px; background: #0B4422; color: white; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${statusInfo.emoji} ${statusInfo.title}</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">DrishiQ Story Update</p>
          </div>
          
          <div class="content">
            <h3 style="color: #0B4422;">Hello ${data.recipientName},</h3>
            
            ${content}
            
            ${data.invitationToken ? `
            <div style="text-align: center;">
              <a href="${this.BASE_URL}/invitation/${data.invitationToken}" class="btn">Claim Your Invitation</a>
            </div>
            ` : ''}
            
            <p>Thank you for being part of the DrishiQ community!</p>
            
            <p>Best regards,<br><strong>The DrishiQ Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2025 DrishiQ. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${statusInfo.title} - "${data.storyTitle}"
      
      Hello ${data.recipientName},
      
      ${data.status === 'approved' ? 'Your story has been approved!' : 
        data.status === 'published' ? 'Your story is now published!' : 
        'Thank you for your story submission.'}
      
      ${data.invitationToken ? `You've earned an invitation! Visit: ${this.BASE_URL}/invitation/${data.invitationToken}` : ''}
      
      ${data.adminNotes ? `Feedback: ${data.adminNotes}` : ''}
      
      Thank you for being part of DrishiQ!
      The DrishiQ Team
    `;

    return { subject, html, text };
  }

  /**
   * Send email using configured service
   */
  private static async sendEmail(emailData: any): Promise<boolean> {
    try {
      // TODO: Replace with actual email service integration
      // Examples: SendGrid, AWS SES, Resend, etc.
      
      logger.info('Email would be sent', emailData);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      logger.error('Email sending failed');
      return false;
    }
  }
} 