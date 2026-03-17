import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Database } from '@/types/supabase';
import { scrapeMercadoLibreDeals, searchMercadoLibre } from '@/lib/scraper';

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const MELI_APP_ID = process.env.MELI_APP_ID || '';
const MELI_CLIENT_SECRET = process.env.MELI_CLIENT_SECRET || '';
const MELI_API_URL = 'https://api.mercadolibre.com';
const MELI_SITE_ID = process.env.MELI_SITE_ID || 'MLM'; // Default to Mexico, can be configured

export interface MeliSearchParams {
  q?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  state?: string; // Location
  limit?: number;
  offset?: number;
}

export class MercadoLibreService {
  /**
   * Get the current valid access token, refreshing if necessary.
   * Returns null if no authorization has been done, allowing public endpoints to proceed.
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const { data: authRecord, error } = await (supabase.from('mercadolibre_auth') as any)
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
        console.error(`[MercadoLibreService] Failed to fetch auth record: ${error.message}`);
        return null;
      }

      if (!authRecord) {
        console.log('[MercadoLibreService] No auth record found. Proceeding without token.');
        return null;
      }

      // Check if token is expired or about to expire in less than 5 minutes
      const expiresAt = new Date(authRecord.expires_at).getTime();
      const now = Date.now();
      
      if (now > expiresAt - 5 * 60 * 1000) {
        console.log('Mercado Libre access token expired, refreshing...');
        return await this.refreshToken(authRecord.refresh_token, authRecord.id);
      }

      return authRecord.access_token;
    } catch (error) {
      console.error('[MercadoLibreService] Error getting access token:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  static async refreshToken(refreshToken: string | null, recordId: string): Promise<string> {
    if (!refreshToken) {
      throw new Error('No refresh token available to renew access token.');
    }

    try {
      const response = await axios.post(`${MELI_API_URL}/oauth/token`, null, {
        params: {
          grant_type: 'refresh_token',
          client_id: MELI_APP_ID,
          client_secret: MELI_CLIENT_SECRET,
          refresh_token: refreshToken,
        },
      });

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
      
      const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      const { error } = await (supabase.from('mercadolibre_auth') as any)
        .update({
          access_token,
          refresh_token: new_refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) {
        throw new Error(`Failed to update auth record: ${error.message}`);
      }

      console.log('Mercado Libre access token successfully refreshed.');
      return access_token;
    } catch (error: any) {
      console.error('[MercadoLibreService] Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Mercado Libre token.');
    }
  }

  /**
   * Initial authorization (to be called via an admin endpoint with the authorization code)
   */
  static async authorize(code: string, redirectUri: string): Promise<void> {
    try {
      const response = await axios.post(`${MELI_API_URL}/oauth/token`, null, {
        params: {
          grant_type: 'authorization_code',
          client_id: MELI_APP_ID,
          client_secret: MELI_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      // Check if a record already exists
      const { data: existing } = await (supabase.from('mercadolibre_auth') as any).select('id').limit(1).single();

      if (existing) {
        await (supabase.from('mercadolibre_auth') as any)
          .update({
            access_token,
            refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await (supabase.from('mercadolibre_auth') as any)
          .insert({
            access_token,
            refresh_token,
            expires_at: expiresAt,
          });
      }

      console.log('Mercado Libre successfully authorized.');
    } catch (error: any) {
      console.error('[MercadoLibreService] Error during authorization:', error.response?.data || error.message);
      throw new Error('Failed to authorize with Mercado Libre.');
    }
  }

  /**
   * Search offers (deals) in Mercado Libre
   */
  static async searchOffers(params: MeliSearchParams) {
    try {
      const token = await this.getAccessToken();
      
      const queryParams: Record<string, any> = {
        limit: params.limit || 50,
        offset: params.offset || 0,
      };

      if (params.q) queryParams.q = params.q;
      if (params.category) queryParams.category = params.category;
      if (params.state) queryParams.state = params.state;
      
      // Price filtering logic (Meli format: min-max)
      if (params.priceMin !== undefined || params.priceMax !== undefined) {
        const min = params.priceMin !== undefined ? params.priceMin : '*';
        const max = params.priceMax !== undefined ? params.priceMax : '*';
        queryParams.price = `${min}-${max}`;
      }

      // We only use deal_of_the_day if no query is provided, to mimic a general "Offers" page
      if (!params.q) {
        queryParams.promotions = 'deal_of_the_day'; 
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${MELI_API_URL}/sites/${MELI_SITE_ID}/search`, {
        headers,
        params: queryParams,
      });

      return response.data.results;
    } catch (error: any) {
      console.error('[MercadoLibreService] API Error fetching offers:', error.response?.data || error.message);
      
      // Fallback to HTML scraper if API fails (e.g. 403 Forbidden due to token scopes)
      console.log('[MercadoLibreService] Falling back to HTML scraper...');
      try {
        if (!params.q || params.q === 'ofertas') {
          const scrapedDeals = await scrapeMercadoLibreDeals();
          // Convert ScrapedDeal to raw API format so the caller doesn't break
          return scrapedDeals.map(deal => deal.raw_data || {
            id: deal.id,
            title: deal.title,
            price: deal.price,
            original_price: deal.original_price,
            thumbnail: deal.image_url,
            permalink: deal.url,
            condition: 'new',
            currency_id: deal.currency,
            shipping: {
              free_shipping: deal.shipping_info?.free_shipping_label,
              logistic_type: deal.shipping_info?.is_full ? 'fulfillment' : null,
              tags: deal.shipping_info?.has_meli_plus ? ['meli_plus'] : []
            },
            installments: {
              quantity: deal.payment_info?.has_msi ? 12 : 1,
              rate: deal.payment_info?.has_msi ? 0 : 10
            }
          });
        } else {
          const searchResults = await searchMercadoLibre(params.q);
          return searchResults.map(deal => deal.raw_data || {
            id: deal.id,
            title: deal.title,
            price: deal.price,
            original_price: deal.original_price,
            thumbnail: deal.image_url,
            permalink: deal.url,
            condition: 'new',
            currency_id: deal.currency,
            shipping: {
              free_shipping: deal.shipping_info?.free_shipping_label,
              logistic_type: deal.shipping_info?.is_full ? 'fulfillment' : null,
              tags: deal.shipping_info?.has_meli_plus ? ['meli_plus'] : []
            }
          });
        }
      } catch (fallbackError) {
        console.error('[MercadoLibreService] Fallback scraper also failed:', fallbackError);
        throw new Error('Failed to fetch offers from Mercado Libre via API and fallback.');
      }
    }
  }

  /**
   * Process and store obtained offers into the database
   */
  static async processAndStoreOffers(offers: any[]) {
    try {
      if (!offers || offers.length === 0) return 0;

      const formattedOffers = offers.map(offer => ({
        external_id: offer.id,
        source: 'mercadolibre',
        title: offer.title,
        price: offer.price,
        original_price: offer.original_price || null,
        currency: offer.currency_id,
        image_url: offer.thumbnail,
        url: offer.permalink,
        description: null,
        scraped_at: new Date().toISOString(),
        status: 'pending',
        raw_data: offer,
      }));

      // Upsert deals (based on external_id and source)
      const { data, error } = await (supabase.from('scraped_deals') as any)
        .upsert(formattedOffers, { onConflict: 'external_id,source' });

      if (error) {
        throw new Error(`Database error storing offers: ${error.message}`);
      }

      // Log success
      await (supabase.from('scraper_logs') as any).insert({
        operation: 'search',
        source: 'mercadolibre',
        status: 'success',
        details: { items_processed: formattedOffers.length }
      });

      return formattedOffers.length;
    } catch (error: any) {
      console.error('[MercadoLibreService] Error storing offers:', error);
      
      // Log error
      await (supabase.from('scraper_logs') as any).insert({
        operation: 'search',
        source: 'mercadolibre',
        status: 'error',
        details: { error: error.message }
      });
      
      throw error;
    }
  }
}
