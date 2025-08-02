import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// DELETE - Delete pricing rate by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete pricing rate
    const { error } = await supabase
      .from('pricing_rates')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('Error deleting pricing rate:', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to delete pricing rate' }, { status: 500 });
    }

    logger.info('Pricing rate deleted', { 
      rateId: params.id,
      deletedBy: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing rate deleted successfully'
    });

  } catch (error) {
    logger.error('Error in pricing delete API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 