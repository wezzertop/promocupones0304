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
