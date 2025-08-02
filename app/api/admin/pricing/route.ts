import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface PricingRate {
  id?: string;
  region_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  package_type: 'free' | 'seed' | 'growth' | 'support' | 'enterprise';
  base_price: number;
  discounted_price: number;
  credits: number;
  validity_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// GET - Fetch all pricing rates
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all pricing rates
    const { data: rates, error } = await supabase
      .from('pricing_rates')
      .select('*')
      .order('region_code', { ascending: true })
      .order('package_type', { ascending: true });

    if (error) {
      logger.error('Error fetching pricing rates:', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to fetch pricing rates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rates: rates || []
    });

  } catch (error) {
    logger.error('Error in pricing API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pricing rate
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: PricingRate = await request.json();

    // Validate required fields
    if (!body.region_code || !body.package_type || body.base_price === undefined || body.discounted_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if rate already exists for this region and package
    const { data: existingRate } = await supabase
      .from('pricing_rates')
      .select('id')
      .eq('region_code', body.region_code)
      .eq('package_type', body.package_type)
      .single();

    if (existingRate) {
      return NextResponse.json({ 
        error: 'Pricing rate already exists for this region and package' 
      }, { status: 409 });
    }

    // Create new pricing rate
    const { data: newRate, error } = await supabase
      .from('pricing_rates')
      .insert([{
        region_code: body.region_code,
        country_name: body.country_name,
        currency_code: body.currency_code,
        currency_symbol: body.currency_symbol,
        package_type: body.package_type,
        base_price: body.base_price,
        discounted_price: body.discounted_price,
        credits: body.credits,
        validity_days: body.validity_days,
        is_active: body.is_active
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating pricing rate:', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to create pricing rate' }, { status: 500 });
    }

    logger.info('Pricing rate created', { 
      rateId: newRate.id,
      region: newRate.region_code,
      package: newRate.package_type,
      createdBy: user.id
    });

    return NextResponse.json({
      success: true,
      rate: newRate
    });

  } catch (error) {
    logger.error('Error in pricing API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing pricing rate
export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: PricingRate = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 });
    }

    // Update pricing rate
    const { data: updatedRate, error } = await supabase
      .from('pricing_rates')
      .update({
        region_code: body.region_code,
        country_name: body.country_name,
        currency_code: body.currency_code,
        currency_symbol: body.currency_symbol,
        package_type: body.package_type,
        base_price: body.base_price,
        discounted_price: body.discounted_price,
        credits: body.credits,
        validity_days: body.validity_days,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating pricing rate:', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to update pricing rate' }, { status: 500 });
    }

    logger.info('Pricing rate updated', { 
      rateId: updatedRate.id,
      region: updatedRate.region_code,
      package: updatedRate.package_type,
      updatedBy: user.id
    });

    return NextResponse.json({
      success: true,
      rate: updatedRate
    });

  } catch (error) {
    logger.error('Error in pricing API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 