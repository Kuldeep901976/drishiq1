import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { email, name, invitationToken, redirectUrl } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // Store magic link in database
    const { error: insertError } = await supabaseClient
      .from('magic_links')
      .insert({
        email,
        token: magicLinkToken,
        expires_at: expiresAt.toISOString(),
        invitation_token: invitationToken,
        used: false
      })

    if (insertError) {
      throw new Error(`Failed to store magic link: ${insertError.message}`)
    }

    // Create magic link URL
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verify?token=${magicLinkToken}&email=${encodeURIComponent(email)}`

    // Send email using Supabase's built-in email service or external service
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
            <h2 style="color: #0B4422; margin-bottom: 20px;">Welcome to DrishiQ, ${name || 'there'}!</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
              Click the button below to securely access your DrishiQ account:
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
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
        Welcome to DrishiQ, ${name || 'there'}!

        Click the link below to securely access your DrishiQ account:
        ${magicLink}

        Security note:
        • This link will expire in 24 hours
        • Only use this link on your personal device
        • If you didn't request this link, please ignore this email

        DrishiQ - Intelligence of Perception
        See Through the Challenge
      `
    }

    // TODO: Integrate with your preferred email service
    // For now, we'll log the email content
    console.log('Magic link email would be sent:', {
      to: email,
      magicLink,
      expiresAt
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Magic link sent successfully',
        expiresAt: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-magic-link function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 