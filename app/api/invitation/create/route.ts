
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';



import { supabase } from '../../../../lib/supabase';
// Helper function to get Indian time
function getIndianTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  
  return istTime.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Helper function to log failed attempts (console only, no database entry)
function logFailedAttempt(data: any, error: string) {
  console.log('Failed invitation attempt:', {
    timestamp: getIndianTime(),
    error: error,
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      category: data.category
    }
  });
}

// Helper function to validate phone number by country code
function validatePhoneByCountryCode(phone: string, countryCode: string): boolean {
  // Remove any non-digit characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  
  switch (countryCode) {
    case '+91': // India
      return cleanPhone.length === 10;
    case '+1': // US/Canada
      return cleanPhone.length === 10;
    case '+44': // UK
      return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    case '+61': // Australia
      return cleanPhone.length === 9;
    case '+86': // China
      return cleanPhone.length === 11;
    case '+81': // Japan
      return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    case '+49': // Germany
      return cleanPhone.length >= 10 && cleanPhone.length <= 12;
    case '+33': // France
      return cleanPhone.length === 9;
    case '+39': // Italy
      return cleanPhone.length >= 9 && cleanPhone.length <= 10;
    case '+34': // Spain
      return cleanPhone.length === 9;
    default:
      // For other countries, require at least 7 digits
      return cleanPhone.length >= 7;
  }
}

// Helper function to validate invitation data
function validateInvitationData(data: any) {
  const errors: string[] = [];
  
  // Required fields for all categories
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (!data.phone?.trim()) errors.push('Phone is required');
  if (!data.language?.trim()) errors.push('Language is required');
  if (!data.category?.trim()) errors.push('Category is required');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email.trim())) {
    errors.push('Please enter a valid email address');
  }
  
  // Phone validation by country code
  if (data.phone && data.country_code) {
    if (!validatePhoneByCountryCode(data.phone, data.country_code)) {
      const countryName = getCountryName(data.country_code);
      errors.push(`Please enter a valid phone number for ${countryName}`);
    }
  }
  
  // Category-specific validation
  if (data.category === 'need_support') {
    if (!data.share_challenge?.trim()) errors.push('Share challenge is required for support category');
    if (!data.challenge_description?.trim()) errors.push('Challenge description is required for support category');
    if (!data.challenge_sub_category?.trim()) errors.push('Challenge sub-category is required for support category');
    if (!data.challenge_specific?.trim()) errors.push('Specific challenge is required for support category');
    if (!data.location?.trim()) errors.push('Location is required for support category');
  }
  
  return errors;
}

// Helper function to get country name from country code
function getCountryName(countryCode: string): string {
  const countries: { [key: string]: string } = {
    '+91': 'India',
    '+1': 'US/Canada',
    '+44': 'UK',
    '+61': 'Australia',
    '+86': 'China',
    '+81': 'Japan',
    '+49': 'Germany',
    '+33': 'France',
    '+39': 'Italy',
    '+34': 'Spain'
  };
  return countries[countryCode] || 'your country';
}

// Helper function to check for existing invitations
async function checkExistingInvitations(email: string, phone: string, countryCode: string) {
  const fullPhone = countryCode ? `${countryCode}${phone}` : phone;
  
  // Check email
  const { data: existingEmail } = await supabase
    .from('Invitation')
    .select('id, email')
    .eq('email', email)
    .single();
    
  if (existingEmail) {
    return { type: 'email', data: existingEmail };
  }
  
  // Check phone (both formats)
  const { data: existingPhone } = await supabase
    .from('Invitation')
    .select('id, phone')
    .or(`phone.eq.${fullPhone},phone.eq.${phone}`)
    .single();
    
  if (existingPhone) {
    return { type: 'phone', data: existingPhone };
  }
  
  return null;
}

// Helper function to create invitation in database
async function createInvitationInDatabase(data: any) {
  const fullPhone = data.country_code ? `${data.country_code}${data.phone}` : data.phone;
  const dbCategory = data.category === 'trial_access' ? 'general' : data.category;
  
  const invitationData = {
    name: data.name,
    email: data.email,
    phone: fullPhone,
    language: data.language,
    location: data.location || null,
    category: dbCategory,
    challenge: data.share_challenge || null,
    challenge_description: data.challenge_description || null,
    type_of_challenge: data.challenge_sub_category || null,
    specific_issue: data.challenge_specific || null,
    invitation_type: 'regular',
    created_by: null,
    token: crypto.randomBytes(32).toString('hex'),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    metadata: {
      attempt_status: 'success',
      attempt_timestamp: getIndianTime(),
      user_agent: data.userAgent || null,
      ip_address: data.ipAddress || null
    }
  };
  
  const { data: result, error } = await supabase
    .from('Invitation')
    .insert(invitationData)
    .select('*')
    .single();
    
  return { data: result, error };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received invitation data:', body);
    
    // Add request metadata
    const requestData = {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    };
    
    // Validate input data
    const validationErrors = validateInvitationData(body);
    if (validationErrors.length > 0) {
      logFailedAttempt(body, `Validation failed: ${validationErrors.join(', ')}`);
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check for existing invitations
    const existing = await checkExistingInvitations(body.email, body.phone, body.country_code);
    if (existing) {
      const errorMessage = existing.type === 'email' 
        ? 'An invitation with this email address already exists'
        : 'An invitation with this phone number already exists';
      
      logFailedAttempt(body, `Duplicate ${existing.type}`);
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }
    
    // Create invitation in database
    const { data: invitation, error: createError } = await createInvitationInDatabase({
      ...body,
      ...requestData
    });
    
    if (createError) {
      console.error('Database creation error:', createError);
      logFailedAttempt(body, `Database error: ${createError.message}`);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }
    
    console.log('Invitation created successfully:', invitation.id);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Invitation created successfully',
      token: invitation.token,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        name: invitation.name,
        email: invitation.email,
        category: invitation.category,
        challenge: invitation.challenge,
        challenge_description: invitation.challenge_description,
        challenge_sub_category: invitation.type_of_challenge,
        challenge_specific: invitation.specific_issue,
        share_challenge: invitation.challenge,
        created_at: invitation.created_at
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in invitation creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 