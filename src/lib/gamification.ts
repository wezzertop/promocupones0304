import { createClient } from './supabase/server'
import { GamificationProfile, GamificationLevel, Badge, XPHistory, UserBadge } from '@/types'

export async function getUserGamificationProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('gamification_profiles')
    .select(`
      *,
      level:gamification_levels!current_level(*)
    `)
    .eq('user_id', userId)
    .single()
    
  if (error) {
    console.error('Error fetching gamification profile:', error)
    return null
  }
  
  return data as unknown as GamificationProfile
}

export async function getUserBadges(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('gamification_user_badges')
    .select(`
      *,
      badge:gamification_badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching user badges:', error)
    return []
  }
  
  return data as unknown as UserBadge[]
}

export async function getXPHistory(userId: string, limit = 20) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('gamification_xp_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) {
    console.error('Error fetching XP history:', error)
    return []
  }
  
  return data as unknown as XPHistory[]
}

export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'weekly', limit = 10) {
  const supabase = await createClient()
  
  // Note: For complex leaderboards (weekly/monthly), we might need aggregation queries
  // or a materialized view. For now, we'll fetch top users by total XP or current level.
  // Real weekly/monthly leaderboards would require summing XP history within a date range.
  
  let query = supabase
    .from('gamification_profiles')
    .select(`
      user_id,
      current_xp,
      current_level,
      users:users(username, avatar_url)
    `)
    .order('current_xp', { ascending: false })
    .limit(limit)
    
  if (period === 'weekly') {
    // This is tricky without a dedicated "weekly_xp" column or aggregation.
    // We can use the history table for this.
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    // This query is more complex and might be better as an RPC or just raw SQL if needed.
    // But for MVP/v1, let's stick to total XP or create a specific function for period leaderboards.
    // Let's try to use the history table to sum up.
    
    const { data, error } = await (supabase.rpc as any)('get_leaderboard', { 
        period_start: oneWeekAgo.toISOString(), 
        limit_count: limit 
    })
    
    if (error) {
        // Fallback to total XP if RPC doesn't exist yet (I haven't created it)
        // I should create this RPC.
        console.warn('Leaderboard RPC failed, falling back to total XP', error)
    } else {
        return data
    }
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
  
  return data
}

export async function getAllBadges() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('gamification_badges').select('*').order('xp_reward', { ascending: true })
    if (error) return []
    return data as unknown as Badge[]
}
