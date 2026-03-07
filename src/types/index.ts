export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Store {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_verified: boolean
}

export interface User {
  id: string
  username: string
  avatar_url: string | null
  karma_points: number
  role: 'user' | 'verified' | 'moderator' | 'admin'
  is_banned?: boolean
}

export interface Deal {
  id: string
  title: string
  description: string
  original_price: number | null
  deal_price: number | null
  discount_percentage: number | null
  deal_url: string
  image_urls: string[]
  deal_type: 'deal' | 'coupon' | 'discussion'
  availability?: 'online' | 'in_store' | null
  shipping_cost?: number | null
  shipping_country?: string | null
  coupon_code?: string | null
  status: 'active' | 'expired' | 'deleted' | 'pending' | 'rejected' | 'revision'
  moderation_notes?: string
  votes_count?: number
  comments_count?: number
  created_at: string
  expires_at: string | null
  user?: User
  store?: Store
  category?: Category
}

export interface GamificationLevel {
  level: number
  xp_required: number
  referral_limit: number
  title: string
  icon_url: string | null
}

export interface GamificationProfile {
  user_id: string
  current_level: number
  current_xp: number
  next_level_xp: number
  streak_days: number
  last_activity_date: string | null
  referral_code: string | null
  referred_by: string | null
  created_at: string
  updated_at: string
  level?: GamificationLevel // Joined
}

export interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon_url: string | null
  xp_reward: number
  category: string
  created_at: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
  is_displayed: boolean
  badge?: Badge // Joined
}

export interface XPHistory {
  id: string
  user_id: string
  amount: number
  source_type: string
  source_id: string | null
  created_at: string
}
