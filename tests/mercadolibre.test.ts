import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { MercadoLibreService } from '../src/lib/mercadolibre/service';

// Mock the entire supabase module via vi.mock
vi.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
  };
  return {
    createClient: () => mockSupabase,
  };
});

vi.mock('axios');

describe('MercadoLibreService', () => {
  let supabaseMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // We dynamically import supabase to access the mocked instance
    const { createClient } = await import('@supabase/supabase-js');
    supabaseMock = createClient('', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return null if no auth record exists', async () => {
      supabaseMock.single.mockResolvedValueOnce({ data: null, error: null });

      const token = await MercadoLibreService.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return valid token without refreshing if not expired', async () => {
      // Token valid for 1 hour
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      supabaseMock.single.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_at: futureDate, refresh_token: 'refresh', id: '1' },
        error: null,
      });

      const token = await MercadoLibreService.getAccessToken();
      expect(token).toBe('valid-token');
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should refresh token if expired', async () => {
      // Token expired 1 hour ago
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      supabaseMock.single.mockResolvedValueOnce({
        data: { access_token: 'old-token', expires_at: pastDate, refresh_token: 'refresh', id: '1' },
        error: null,
      });

      supabaseMock.eq.mockResolvedValueOnce({ data: {}, error: null });

      (axios.post as any).mockResolvedValueOnce({
        data: {
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        },
      });

      const token = await MercadoLibreService.getAccessToken();
      expect(token).toBe('new-token');
      expect(axios.post).toHaveBeenCalled();
      expect(supabaseMock.update).toHaveBeenCalledWith(expect.objectContaining({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
      }));
    });
  });

  describe('searchOffers', () => {
    it('should fetch offers with correct parameters', async () => {
      // Setup valid token
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      supabaseMock.single.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_at: futureDate, refresh_token: 'refresh', id: '1' },
        error: null,
      });

      (axios.get as any).mockResolvedValueOnce({
        data: {
          results: [{ id: 'MLM123', title: 'Test Deal' }],
        },
      });

      const results = await MercadoLibreService.searchOffers({
        q: 'laptop',
        priceMin: 100,
        priceMax: 500,
        category: 'MLA123',
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('MLM123');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' },
          params: expect.objectContaining({
            q: 'laptop',
            price: '100-500',
            category: 'MLA123',
          }),
        })
      );
    });
  });

  describe('processAndStoreOffers', () => {
    it('should correctly format and upsert deals to the database', async () => {
      const mockOffers = [
        {
          id: 'MLM123',
          title: 'Discounted Laptop',
          price: 999,
          original_price: 1200,
          currency_id: 'MXN',
          thumbnail: 'http://img.com/1.jpg',
          permalink: 'http://ml.com/1',
        },
      ];

      supabaseMock.upsert.mockResolvedValueOnce({ data: [], error: null });
      supabaseMock.insert.mockResolvedValueOnce({ data: [], error: null }); // for logging

      const count = await MercadoLibreService.processAndStoreOffers(mockOffers);

      expect(count).toBe(1);
      
      // Ensure upsert was called with correctly mapped fields
      expect(supabaseMock.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            external_id: 'MLM123',
            source: 'mercadolibre',
            title: 'Discounted Laptop',
            price: 999,
            status: 'pending',
          })
        ]),
        { onConflict: 'external_id,source' }
      );

      // Ensure success was logged
      expect(supabaseMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'search',
          source: 'mercadolibre',
          status: 'success',
        })
      );
    });
  });
});
