
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting temporarily disabled for deployment

    const body = await request.json();
    const { 
      support_level, 
      amount, 
      supporter_email, 
      supporter_name,
      needy_id = null, // Optional: specific needy individual
      purpose = 'general'
    } = body;

    if (!support_level || !amount || !supporter_email) {
      return NextResponse.json(
        { error: 'Support level, amount, and supporter email are required' },
        { status: 400 }
      );
    }

    // Define credit allocation based on support level
    const creditAllocation = {
      seed: { credits: 1, description: 'Seed Support - 1 credit allocated' },
      growth: { credits: 10, description: 'Growth Support - 10 credits allocated' },
      wisdom: { credits: 20, description: 'Wisdom Support - 20 credits allocated' },
      heart: { credits: 5, description: 'Heart Support - 5 credits allocated' }
    };

    const allocation = creditAllocation[support_level as keyof typeof creditAllocation];
    if (!allocation) {
      return NextResponse.json(
        { error: 'Invalid support level' },
        { status: 400 }
      );
    }

    // Get or create supporter user
    let supporterId: string;
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', supporter_email)
      .single();

    if (userError || !existingUser) {
      // Create new supporter user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: supporter_email,
          full_name: supporter_name || 'Anonymous Supporter',
          role: 'supporter',
          is_verified: true
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating supporter user:', createError);
        return NextResponse.json(
          { error: 'Failed to create supporter account' },
          { status: 500 }
        );
      }
      supporterId = newUser.id;
    } else {
      supporterId = existingUser.id;
    }

    // If no specific needy individual, find one with highest priority
    let targetNeedyId = needy_id;
    if (!targetNeedyId) {
      const { data: needyIndividuals, error: needyError } = await supabase
        .from('needy_individuals')
        .select('id, priority_score')
        .eq('status', 'active')
        .order('priority_score', { ascending: false })
        .limit(1)
        .single();

      if (needyError || !needyIndividuals) {
        console.error('Error finding needy individual:', needyError);
        return NextResponse.json(
          { error: 'No needy individuals available for support' },
          { status: 404 }
        );
      }
      targetNeedyId = needyIndividuals.id;
    }

    // Allocate support credits
    const { data: allocationId, error: allocationError } = await supabase.rpc('allocate_support_credits', {
      supporter_uuid: supporterId,
      needy_uuid: targetNeedyId,
      credits_amount: allocation.credits,
      purpose_text: purpose,
      notes_text: `${allocation.description} - Payment: ₹${amount}`
    });

    if (allocationError) {
      console.error('Error allocating support credits:', allocationError);
      return NextResponse.json(
        { error: 'Failed to allocate support credits' },
        { status: 500 }
      );
    }

    // Record payment transaction
    const { error: paymentError } = await supabase
      .from('payment_transactions')
      .insert([{
        user_id: supporterId,
        amount: parseFloat(amount),
        currency_code: 'INR',
        status: 'succeeded',
        payment_method: 'support_donation',
        description: `${support_level} Support - ${allocation.credits} credits allocated`,
        metadata: {
          support_level,
          credits_allocated: allocation.credits,
          needy_id: targetNeedyId,
          allocation_id: allocationId
        }
      }]);

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      // Don't fail the request, just log the error
    }

    // Get allocation details for response
    const { data: allocationDetails, error: fetchError } = await supabase
      .from('support_credit_allocations')
      .select(`
        *,
        needy:needy_individuals(full_name, email, phone)
      `)
      .eq('id', allocationId)
      .single();

    if (fetchError) {
      console.error('Error fetching allocation details:', fetchError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${allocation.credits} credits`,
      allocation: {
        id: allocationId,
        credits_allocated: allocation.credits,
        supporter_id: supporterId,
        needy_id: targetNeedyId,
        purpose,
        details: allocationDetails
      }
    });

  } catch (error) {
    console.error('Error in support credit allocation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 