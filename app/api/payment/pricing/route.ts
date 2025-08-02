import { logger } from '@/lib/logger';
import { PaymentService } from '@/lib/payment-service-simple';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region') || 'GLOBAL';
    const type = searchParams.get('type') || 'plans'; // 'plans' or 'credits'

    if (type === 'credits') {
      // Get credit packages
      const creditPackages = await PaymentService.getCreditPackages(regionCode);
      return NextResponse.json({ 
        success: true, 
        data: creditPackages,
        region: regionCode 
      });
    } else {
      // Get pricing plans
      const [plans, regions, regionalPricing] = await Promise.all([
        PaymentService.getPricingPlans(),
        PaymentService.getPricingRegions(),
        PaymentService.getRegionalPricing(regionCode)
      ]);

      return NextResponse.json({ 
        success: true, 
        data: {
          plans,
          regions,
          regionalPricing,
          selectedRegion: regionCode
        }
      });
    }
  } catch (error) {
    logger.error('Pricing API error');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 