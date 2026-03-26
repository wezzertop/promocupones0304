import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const state = searchParams.get('state'); // location
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('scraped_deals')
      .select('*', { count: 'exact' })
      .eq('source', 'mercadolibre')
      .eq('status', 'pending');

    // Filter by text search
    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    // Filter by price
    if (priceMin) {
      query = query.gte('price', parseFloat(priceMin));
    }
    if (priceMax) {
      query = query.lte('price', parseFloat(priceMax));
    }

    // JSONB filters for category and location if present in raw_data
    if (category) {
      query = query.eq('raw_data->>category_id', category);
    }
    if (state) {
      query = query.eq('raw_data->address->>state_id', state);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order('scraped_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[API] Mercado Libre offers error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
