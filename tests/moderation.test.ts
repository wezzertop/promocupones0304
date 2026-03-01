import { isReferralUrl, getUserReferralLimit, POINT_SYSTEM } from '../src/lib/moderation'

// Mock Supabase client if needed, but for unit tests of pure functions we might not need it
// For isReferralUrl, we need to mock createClient because it calls the DB
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [{ pattern: 'bad-pattern' }] })
      })
    })
  })
}))

describe('Moderation System', () => {
  
  describe('Referral URL Detection', () => {
    test('should detect common referral patterns', async () => {
      const result = await isReferralUrl('https://amazon.com/dp/12345?tag=my-affiliate-20')
      expect(result.isReferral).toBe(true)
      expect(result.reason).toContain('patrón sospechoso')
    })

    test('should allow clean URLs', async () => {
      const result = await isReferralUrl('https://amazon.com/dp/12345')
      expect(result.isReferral).toBe(false)
    })
  })

  describe('Point System', () => {
    test('should return correct limit for low points', () => {
      const limit = getUserReferralLimit(50)
      expect(limit).toBe(0)
    })

    test('should return correct limit for medium points', () => {
      const limit = getUserReferralLimit(150)
      expect(limit).toBe(1)
    })

    test('should return correct limit for high points', () => {
      const limit = getUserReferralLimit(600)
      expect(limit).toBe(3)
    })
  })
})
