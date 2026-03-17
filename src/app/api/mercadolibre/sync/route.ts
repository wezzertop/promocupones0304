import { NextRequest, NextResponse } from 'next/server';
import { MercadoLibreService } from '@/lib/mercadolibre/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Configurable parameters
    const params = {
      q: body.q || 'ofertas',
      category: body.category,
      priceMin: body.priceMin,
      priceMax: body.priceMax,
      state: body.state,
      limit: body.limit || 50,
      offset: body.offset || 0,
    };

    console.log('[API] Syncing Mercado Libre offers with params:', params);

    // Fetch from Mercado Libre
    const offers = await MercadoLibreService.searchOffers(params);
    
    // Store in DB
    const processedCount = await MercadoLibreService.processAndStoreOffers(offers);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${processedCount} offers from Mercado Libre.`,
      count: processedCount,
    });
  } catch (error: any) {
    console.error('[API] Mercado Libre sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
