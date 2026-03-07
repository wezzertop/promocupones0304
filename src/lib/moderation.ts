import { createClient } from '@/lib/supabase/client'

export const REFERRAL_PATTERNS = [
  'ref=',
  'referrer=',
  'aff=',
  'affiliate=',
  'tag=',
  'utm_source=',
  'click_id=',
  'amazon.com/dp/', // Often has tracking
  'amzn.to',
  'bit.ly', // Shorteners often hide referrals
  'goo.gl',
  't.co',
]

// Deprecated: Use gamification levels instead
export const REFERRAL_TIERS = {
  NO_REFERRALS: { min: 0, max: 100, limit: 0 },
  LOW_TIER: { min: 101, max: 500, limit: 1 }, 
  HIGH_TIER: { min: 501, max: Infinity, limit: 3 },
}

export const POINT_SYSTEM = {
  POST_APPROVED: 10,
  COMMENT_APPROVED: 2,
  VOTE_RECEIVED: 1,
  REPORT_VALID: 5,
  POST_REJECTED: -5
}

export async function isReferralUrl(url: string): Promise<{ isReferral: boolean; reason?: string }> {
  const lowerUrl = url.toLowerCase()
  
  // 1. Check hardcoded patterns
  for (const pattern of REFERRAL_PATTERNS) {
    if (lowerUrl.includes(pattern)) {
      return { isReferral: true, reason: `Contiene patrón sospechoso: ${pattern}` }
    }
  }

  // 2. Check DB patterns
  const supabase = createClient()
  const { data: dbPatterns } = await (supabase.from('referral_patterns') as any)
    .select('pattern')
    .eq('is_active', true)

  if (dbPatterns) {
    for (const p of (dbPatterns as any[])) {
      if (lowerUrl.includes(p.pattern.toLowerCase())) {
         return { isReferral: true, reason: `Detectado por patrón del sistema: ${p.pattern}` }
      }
    }
  }

  return { isReferral: false }
}

export async function canUserPostReferral(userId: string): Promise<{ canPost: boolean; limit: number; used: number }> {
  const supabase = createClient()
  
  // Get user gamification level
  const { data: profile } = await (supabase.from('gamification_profiles') as any)
    .select('current_level')
    .eq('user_id', userId)
    .single()
    
  if (!profile) return { canPost: false, limit: 0, used: 0 }
  
  const currentLevel = (profile as any).current_level

  // Get referral limit based on level
  const { data: levelData } = await (supabase.from('gamification_levels') as any)
    .select('referral_limit')
    .eq('level', currentLevel)
    .single()
    
  const limit = (levelData as any)?.referral_limit || 0
  
  if (limit === 0) return { canPost: false, limit: 0, used: 0 }

  // Check posts in the last week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Count deals that are marked as referrals OR match patterns (fallback)
  const { count, error } = await (supabase.from('deals') as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo.toISOString())
    .eq('is_referral', true) // Assuming new column is_referral

  if (error) {
      console.error('Error checking referral limits:', error)
      return { canPost: false, limit, used: 0 } // Fail safe
  }
  
  const used = count || 0
  return { canPost: used < limit, limit, used }
}

export async function addKarmaPoints(userId: string, points: number, reason: string) {
  const supabase = createClient()
  
  // 1. Update user points
  const { error } = await (supabase.rpc as any)('increment_karma', { 
    row_id: userId, 
    amount: points 
  })

  // Fallback if RPC doesn't exist (client-side update, less safe but works for now)
  if (error) {
    const { data: user } = await (supabase.from('users') as any)
      .select('karma_points')
      .eq('id', userId)
      .single()
      
    if (user) {
      await (supabase.from('users') as any)
        .update({ karma_points: ((user as any).karma_points || 0) + points })
        .eq('id', userId)
    }
  }

  // 2. Log activity (optional, if we had an activity log table)
}

export async function checkForbiddenWords(text: string): Promise<{ hasForbidden: boolean; word?: string }> {
  if (!text) return { hasForbidden: false }
  
  const supabase = createClient()
  const { data: forbidden } = await (supabase.from('forbidden_words') as any)
    .select('word')
  
  if (!forbidden) return { hasForbidden: false }

  const lowerText = text.toLowerCase()
  
  for (const item of (forbidden as any[])) {
    // Check for whole words or just substrings? 
    // Substrings can be aggressive (e.g. "ass" in "class").
    // Let's stick to substrings for now as requested "palabras que bloquearán", 
    // but maybe we should use regex for word boundaries later if user complains.
    // For now, simple includes is safer for catching variations.
    if (lowerText.includes(item.word.toLowerCase())) {
      return { hasForbidden: true, word: item.word }
    }
  }

  return { hasForbidden: false }
}
