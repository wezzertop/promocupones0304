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

export const POINT_SYSTEM = {
  POST_APPROVED: 10,
  POST_REJECTED: -5,
  COMMENT_APPROVED: 2,
  VOTE_RECEIVED: 1,
  REPORT_VALID: 5,
}

export const REFERRAL_TIERS = {
  NO_REFERRALS: { min: 0, max: 100, limit: 0 },
  LOW_TIER: { min: 101, max: 500, limit: 1 }, // 1 per week
  HIGH_TIER: { min: 501, max: Infinity, limit: 3 }, // 3 per week
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
  const { data: dbPatterns } = await supabase
    .from('referral_patterns')
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

export function getUserReferralLimit(karmaPoints: number): number {
  if (karmaPoints <= REFERRAL_TIERS.NO_REFERRALS.max) return REFERRAL_TIERS.NO_REFERRALS.limit
  if (karmaPoints <= REFERRAL_TIERS.LOW_TIER.max) return REFERRAL_TIERS.LOW_TIER.limit
  return REFERRAL_TIERS.HIGH_TIER.limit
}

export async function canUserPostReferral(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  // Get user karma
  const { data: user } = await supabase
    .from('users')
    .select('karma_points')
    .eq('id', userId)
    .single()

  if (!user) return false

  const limit = getUserReferralLimit((user as any).karma_points)
  if (limit === 0) return false

  // Check posts in the last week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('created_at', oneWeekAgo.toISOString())
    .ilike('deal_url', '%ref=%') // Simple check, ideally we flag referrals in DB

  return (count || 0) < limit
}

export async function addKarmaPoints(userId: string, points: number, reason: string) {
  const supabase = createClient()
  
  // 1. Update user points
  const { error } = await supabase.rpc('increment_karma', { 
    row_id: userId, 
    amount: points 
  })

  // Fallback if RPC doesn't exist (client-side update, less safe but works for now)
  if (error) {
    const { data: user } = await supabase
      .from('users')
      .select('karma_points')
      .eq('id', userId)
      .single()
      
    if (user) {
      await supabase
        .from('users')
        .update({ karma_points: ((user as any).karma_points || 0) + points })
        .eq('id', userId)
    }
  }

  // 2. Log activity (optional, if we had an activity log table)
}

export async function checkForbiddenWords(text: string): Promise<{ hasForbidden: boolean; word?: string }> {
  if (!text) return { hasForbidden: false }
  
  const supabase = createClient()
  const { data: forbidden } = await supabase
    .from('forbidden_words')
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
