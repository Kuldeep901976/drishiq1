import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const state = requestUrl.searchParams.get('state'); // Get the state parameter

  console.log('Auth callback called:', { 
    code: !!code, 
    error, 
    errorDescription, 
    state,
    url: request.url 
  });

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/signin?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    try {
      console.log('Exchanging code for session...');
      // Exchange the code for a session
      const { data, error: signInError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (signInError) {
        console.error('Error exchanging code for session:', signInError);
        return NextResponse.redirect(
          `${requestUrl.origin}/signin?error=${encodeURIComponent('Authentication failed')}`
        );
      }

      console.log('Session created, user:', data.user?.id);
      console.log('User metadata:', data.user?.user_metadata);

      // Create service role client for profile creation
      const serviceClient = supabase;

      // Check if user profile exists
      if (data.user) {
        console.log('Checking if user profile exists...');
        const { data: existingProfile } = await serviceClient
          .from('users')
          .select('id, full_name, is_profile_complete')
          .eq('id', data.user.id)
          .single();

        console.log('Existing profile:', existingProfile);

        if (!existingProfile) {
          console.log('Creating new user profile...');
          // New user - create profile
          const profileData: any = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
            preferred_language: 'en',
            auth_provider: 'social',
            is_profile_complete: false
          };

          // Try to add new fields if they exist (will be ignored if columns don't exist yet)
          try {
            const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User';
            const nameParts = fullName.split(' ');
            profileData.first_name = nameParts[0] || '';
            profileData.last_name = nameParts.slice(1).join(' ') || '';
          } catch (err) {
            // Ignore errors for new fields that might not exist yet
            console.log('Some profile fields not available yet:', err);
          }

          const { error: insertError } = await serviceClient.from('users').insert(profileData);
          
          if (insertError) {
            console.error('Error creating user profile:', insertError);
          } else {
            console.log('Profile created successfully');
          }
        }

        // Parse flow data from state parameter
        let flowData: { plan?: string; amount?: string; description?: string } = {};
        let invitation = '';
        let redirect = '';
        
        if (state) {
          const stateParts = state.split('|');
          if (stateParts.length >= 3) {
            const [plan, amount, description, stateInvitation, stateRedirect] = stateParts;
            if (plan) flowData = { plan, amount, description };
            if (stateInvitation) invitation = stateInvitation;
            if (stateRedirect) redirect = stateRedirect;
          }
          console.log('Flow data from state:', { flowData, invitation, redirect });
        }

        // Determine redirect based on profile status and context
        if (!existingProfile || !existingProfile.is_profile_complete) {
          console.log('Redirecting to profile page');
          const params = new URLSearchParams();
          if (invitation) params.append('invitation', invitation);
          if (redirect) params.append('redirect', redirect);
          if (flowData.plan) params.append('plan', flowData.plan);
          if (flowData.amount) params.append('amount', flowData.amount);
          if (flowData.description) params.append('description', flowData.description);
          
          const redirectUrl = `${requestUrl.origin}/profile?${params.toString()}`;
          console.log('Redirecting to:', redirectUrl);
          return NextResponse.redirect(redirectUrl);
        } else {
          // Profile is complete, redirect based on context
          if (invitation) {
            // If there's an invitation, redirect back to it
            console.log('Profile complete, redirecting to invitation');
            return NextResponse.redirect(`${requestUrl.origin}/invite/${invitation}`);
          } else if (redirect) {
            // If there's a redirect, use it
            console.log('Profile complete, redirecting to:', redirect);
            return NextResponse.redirect(`${requestUrl.origin}${redirect}`);
          } else {
            // Default redirect to chat
            console.log('Profile complete, redirecting to chat');
            return NextResponse.redirect(`${requestUrl.origin}/chat`);
          }
        }
      }

      // Fallback redirect
      console.log('Fallback redirect to profile');
      return NextResponse.redirect(`${requestUrl.origin}/profile`);
      
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent('Authentication failed')}`
      );
    }
  }

  // No code or error, redirect to signin
  console.log('No code or error, redirecting to signin');
  return NextResponse.redirect(`${requestUrl.origin}/signin`);
} 