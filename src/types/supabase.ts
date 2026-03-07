export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          role: 'user' | 'verified' | 'moderator' | 'admin'
          karma_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          role?: 'user' | 'verified' | 'moderator' | 'admin'
          karma_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          role?: 'user' | 'verified' | 'moderator' | 'admin'
          karma_points?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website_url: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: string
          user_id: string
          category_id: string
          store_id: string | null
          title: string
          description: string | null
          original_price: number | null
          deal_price: number | null
          discount_percentage: number | null
          deal_url: string
          image_urls: Json | null
          deal_type: 'deal' | 'coupon' | 'discussion'
          status: 'active' | 'expired' | 'deleted' | 'pending' | 'rejected' | 'revision'
          expires_at: string | null
          created_at: string
          updated_at: string
          coupon_code: string | null
          availability: 'online' | 'in_store' | null
          shipping_cost: number | null
          shipping_country: string | null
          start_date: string | null
          votes_count: number
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          store_id?: string | null
          title: string
          description?: string | null
          original_price?: number | null
          deal_price?: number | null
          discount_percentage?: number | null
          deal_url: string
          image_urls?: Json | null
          deal_type?: 'deal' | 'coupon' | 'discussion'
          status?: 'active' | 'expired' | 'deleted' | 'pending' | 'rejected' | 'revision'
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          coupon_code?: string | null
          availability?: 'online' | 'in_store' | null
          shipping_cost?: number | null
          shipping_country?: string | null
          start_date?: string | null
          votes_count?: number
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          store_id?: string | null
          title?: string
          description?: string | null
          original_price?: number | null
          deal_price?: number | null
          discount_percentage?: number | null
          deal_url?: string
          image_urls?: Json | null
          deal_type?: 'deal' | 'coupon' | 'discussion'
          status?: 'active' | 'expired' | 'deleted' | 'pending' | 'rejected' | 'revision'
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          coupon_code?: string | null
          availability?: 'online' | 'in_store' | null
          shipping_cost?: number | null
          shipping_country?: string | null
          start_date?: string | null
          votes_count?: number
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_store_id_fkey"
            columns: ["store_id"]
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          user_id: string
          deal_id: string
          vote_type: 'hot' | 'cold'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deal_id: string
          vote_type: 'hot' | 'cold'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deal_id?: string
          vote_type?: 'hot' | 'cold'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_deal_id_fkey"
            columns: ["deal_id"]
            referencedRelation: "deals"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          deal_id: string
          content: string
          likes_count: number
          created_at: string
          updated_at: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          deal_id: string
          content: string
          likes_count?: number
          created_at?: string
          updated_at?: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          deal_id?: string
          content?: string
          likes_count?: number
          created_at?: string
          updated_at?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_deal_id_fkey"
            columns: ["deal_id"]
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_votes: {
        Row: {
            user_id: string
            comment_id: string
            vote_type: 'like' | 'dislike'
            change_count: number
        }
        Insert: {
            user_id: string
            comment_id: string
            vote_type: 'like' | 'dislike'
            change_count?: number
        }
        Update: {
            user_id?: string
            comment_id?: string
            vote_type?: 'like' | 'dislike'
            change_count?: number
        }
        Relationships: [
            {
                foreignKeyName: "comment_votes_user_id_fkey"
                columns: ["user_id"]
                referencedRelation: "users"
                referencedColumns: ["id"]
            },
            {
                foreignKeyName: "comment_votes_comment_id_fkey"
                columns: ["comment_id"]
                referencedRelation: "comments"
                referencedColumns: ["id"]
            }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string | null
          target_id: string
          target_type: 'deal' | 'comment'
          reason: string
          description: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          target_id: string
          target_type: 'deal' | 'comment'
          reason: string
          description?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string | null
          target_id?: string
          target_type?: 'deal' | 'comment'
          reason?: string
          description?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_levels: {
        Row: {
          level: number
          xp_required: number
          referral_limit: number
          title: string
          icon_url: string | null
        }
        Insert: {
          level: number
          xp_required: number
          referral_limit: number
          title: string
          icon_url?: string | null
        }
        Update: {
          level?: number
          xp_required?: number
          referral_limit?: number
          title?: string
          icon_url?: string | null
        }
        Relationships: []
      }
      gamification_profiles: {
        Row: {
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
        }
        Insert: {
          user_id: string
          current_level?: number
          current_xp?: number
          next_level_xp?: number
          streak_days?: number
          last_activity_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_level?: number
          current_xp?: number
          next_level_xp?: number
          streak_days?: number
          last_activity_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_profiles_current_level_fkey"
            columns: ["current_level"]
            referencedRelation: "gamification_levels"
            referencedColumns: ["level"]
          },
          {
            foreignKeyName: "gamification_profiles_referred_by_fkey"
            columns: ["referred_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_badges: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon_url: string | null
          xp_reward: number
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          icon_url?: string | null
          xp_reward?: number
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          xp_reward?: number
          category?: string
          created_at?: string
        }
        Relationships: []
      }
      gamification_user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
          is_displayed: boolean
        }
        Insert: {
          user_id: string
          badge_id: string
          earned_at?: string
          is_displayed?: boolean
        }
        Update: {
          user_id?: string
          badge_id?: string
          earned_at?: string
          is_displayed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gamification_user_badges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            referencedRelation: "gamification_badges"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_xp_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          source_type: string
          source_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source_type: string
          source_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source_type?: string
          source_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_xp_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gamification_referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string
          status: string
          reward_claimed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id: string
          status?: string
          reward_claimed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string
          status?: string
          reward_claimed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_messages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string | null
          message: string
          status: 'new' | 'read' | 'replied' | 'archived'
          created_at: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          subject?: string | null
          message: string
          status?: 'new' | 'read' | 'replied' | 'archived'
          created_at?: string
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          subject?: string | null
          message?: string
          status?: 'new' | 'read' | 'replied' | 'archived'
          created_at?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, Json>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, Json>
        Returns: Json
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}
