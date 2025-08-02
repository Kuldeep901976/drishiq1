import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../lib/supabase';

interface SupporterFormData {
  mode: 'seeker' | 'supporter';
  domain: string;
  type: string;
  issue: string;
  openToAll: boolean;
  otherText: string;
  email?: string;
  name?: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SupporterFormData = await request.json();
    
    // Validate required fields
    if (!body.mode) {
      return NextResponse.json(
        { error: 'Mode is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServiceClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Prepare data for insertion
    const supporterData = {
      mode: body.mode,
      domain: body.domain || null,
      type: body.type || null,
      issue: body.issue || null,
      open_to_all: body.openToAll,
      other_text: body.otherText || null,
      email: body.email || null,
      name: body.name || null,
      phone: body.phone || null,
      created_at: new Date().toISOString(),
      status: 'pending', // pending, matched, contacted, completed
      matched_with: null as string[] | null,
      notes: null as string | null
    };

    // Insert into supporters table
    const { data, error } = await supabase
      .from('supporters')
      .insert([supporterData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save supporter data' },
        { status: 500 }
      );
    }

    // If it's a supporter, try to find potential matches
    if (body.mode === 'supporter') {
      await findPotentialMatches(data.id, supporterData);
    }

    // If it's a seeker, try to find available supporters
    if (body.mode === 'seeker') {
      await findAvailableSupporters(data.id, supporterData);
    }

    return NextResponse.json({
      success: true,
      message: 'Supporter form submitted successfully',
      data: {
        id: data.id,
        mode: data.mode,
        status: data.status
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function findPotentialMatches(supporterId: string, supporterData: any) {
  try {
    const supabase = createServiceClient();
    
    if (!supabase) return;

    // Find seekers who match the supporter's criteria
    let query = supabase
      .from('supporters')
      .select('*')
      .eq('mode', 'seeker')
      .eq('status', 'pending');

    // If supporter is not open to all, match by domain/type/issue
    if (!supporterData.open_to_all) {
      if (supporterData.domain) {
        query = query.eq('domain', supporterData.domain);
      }
      if (supporterData.type) {
        query = query.eq('type', supporterData.type);
      }
      if (supporterData.issue) {
        query = query.eq('issue', supporterData.issue);
      }
    }

    const { data: matches } = await query.limit(5);

    if (matches && matches.length > 0) {
      // Update supporter with potential matches
      await supabase
        .from('supporters')
        .update({ 
          matched_with: matches.map(m => m.id),
          status: 'matched'
        })
        .eq('id', supporterId);

      // Update seekers with this supporter as a match
      for (const match of matches) {
        await supabase
          .from('supporters')
          .update({ 
            matched_with: [supporterId],
            status: 'matched'
          })
          .eq('id', match.id);
      }
    }
  } catch (error) {
    console.error('Error finding matches:', error);
  }
}

async function findAvailableSupporters(seekerId: string, seekerData: any) {
  try {
    const supabase = createServiceClient();
    
    if (!supabase) return;

    // Find supporters who match the seeker's criteria
    let query = supabase
      .from('supporters')
      .select('*')
      .eq('mode', 'supporter')
      .eq('status', 'pending');

    // Match by domain/type/issue
    if (seekerData.domain) {
      query = query.or(`domain.eq.${seekerData.domain},open_to_all.eq.true`);
    }
    if (seekerData.type) {
      query = query.eq('type', seekerData.type);
    }
    if (seekerData.issue) {
      query = query.eq('issue', seekerData.issue);
    }

    const { data: matches } = await query.limit(5);

    if (matches && matches.length > 0) {
      // Update seeker with potential matches
      await supabase
        .from('supporters')
        .update({ 
          matched_with: matches.map(m => m.id),
          status: 'matched'
        })
        .eq('id', seekerId);

      // Update supporters with this seeker as a match
      for (const match of matches) {
        await supabase
          .from('supporters')
          .update({ 
            matched_with: [seekerId],
            status: 'matched'
          })
          .eq('id', match.id);
      }
    }
  } catch (error) {
    console.error('Error finding supporters:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const status = searchParams.get('status');

    const supabase = createServiceClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    let query = supabase.from('supporters').select('*');

    if (mode) {
      query = query.eq('mode', mode);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supporters' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 