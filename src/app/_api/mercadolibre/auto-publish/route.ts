import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { MercadoLibreService } from '@/lib/mercadolibre/service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Configurable parameters
    const params = {
      q: body.q,
      category: body.category, // ML Category ID
      limit: body.limit || 10,
    };

    // System user mapping
    const userId = body.userId; 
    const systemCategoryId = body.categoryId; // Your local app's category UUID

    if (!userId || !systemCategoryId) {
      return NextResponse.json(
        { success: false, error: 'userId and categoryId are required to auto-publish.' },
        { status: 400 }
      );
    }

    console.log('[API] Auto-publishing Mercado Libre offers...', params);

    // Fetch from Mercado Libre
    const offers = await MercadoLibreService.searchOffers(params);
    if (!offers || offers.length === 0) {
      return NextResponse.json({ success: true, message: 'No offers found to publish.', count: 0 });
    }

    // Get Store ID for Mercado Libre
    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .ilike('name', '%Mercado Libre%')
      .limit(1)
      .single();

    const storeId = storeData?.id || null;

    const dealsToInsert = offers.map((item: any) => {
      // Calculate discount percentage
      let discount_percentage = null;
      if (item.original_price && item.original_price > item.price) {
        discount_percentage = Math.round(((item.original_price - item.price) / item.original_price) * 100);
      }

      const imageUrl = item.thumbnail ? item.thumbnail.replace('I.jpg', 'O.jpg') : '';
      const has_meli_plus = item.shipping?.tags?.includes('meli_plus') || false;
      const is_full = item.shipping?.logistic_type === 'fulfillment';
      const free_shipping_label = item.shipping?.free_shipping || false;

      let descriptionWithShipping = `Oferta oficial de Mercado Libre. Condición: ${item.condition === 'new' ? 'Nuevo' : 'Usado'}.`;
      const shippingDetails = [];
      if (has_meli_plus) shippingDetails.push('Meli+');
      if (is_full) shippingDetails.push('Full');
      if (free_shipping_label) shippingDetails.push('Envío Gratis');
      
      if (shippingDetails.length > 0) {
        descriptionWithShipping += `\n\n**Detalles:** ${shippingDetails.join(', ')}.`;
      }

      return {
        user_id: userId,
        title: item.title,
        description: descriptionWithShipping,
        deal_price: item.price,
        original_price: item.original_price || null,
        discount_percentage,
        deal_url: item.permalink,
        image_urls: imageUrl ? [imageUrl] : [],
        category_id: systemCategoryId,
        store_id: storeId,
        status: 'active',
        deal_type: 'deal',
        availability: item.status === 'active' ? 'online' : 'out_of_stock',
        shipping_country: 'MX',
        shipping_cost: free_shipping_label ? 0 : null,
        moderated_by: userId,
        moderated_at: new Date().toISOString(),
        moderation_notes: 'Auto-published from Mercado Libre API.'
      };
    });

    const { error } = await supabase.from('deals').insert(dealsToInsert);

    if (error) {
      throw new Error(`Database error publishing deals: ${error.message}`);
    }

    // Also store them in scraped_deals for history
    await MercadoLibreService.processAndStoreOffers(offers);

    return NextResponse.json({
      success: true,
      message: `Successfully auto-published ${dealsToInsert.length} offers from Mercado Libre.`,
      count: dealsToInsert.length,
    });
  } catch (error: any) {
    console.error('[API] Mercado Libre auto-publish error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}