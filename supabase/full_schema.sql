-- Full Database Schema for Promocupones
-- Generated from migration files

-- DROP ALL EXISTING TABLES TO ENSURE CLEAN SLATE
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.saves CASCADE;
DROP TABLE IF EXISTS public.comment_votes CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.referral_patterns CASCADE;
DROP TABLE IF EXISTS public.moderation_logs CASCADE;
DROP TABLE IF EXISTS public.forbidden_words CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.scraped_deals CASCADE;
DROP TABLE IF EXISTS public.scraper_logs CASCADE;
DROP TABLE IF EXISTS public.gamification_levels CASCADE;
DROP TABLE IF EXISTS public.gamification_profiles CASCADE;
DROP TABLE IF EXISTS public.gamification_badges CASCADE;
DROP TABLE IF EXISTS public.gamification_user_badges CASCADE;
DROP TABLE IF EXISTS public.gamification_xp_history CASCADE;
DROP TABLE IF EXISTS public.gamification_referrals CASCADE;
DROP TABLE IF EXISTS public.gamification_daily_streaks CASCADE;
DROP TABLE IF EXISTS public.reputation_transfers CASCADE;

-- 
-- Start of 20240227000000_init_schema.sql
-- 

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Note: Supabase Auth handles passwords, but we keep this if we need to store extra info or for reference in the architecture
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'verified', 'moderator', 'admin')),
    karma_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_karma ON users(karma_points DESC);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Tecnología', 'tecnologia', '💻', 1),
('Hogar', 'hogar', '🏠', 2),
('Moda', 'moda', '👕', 3),
('Alimentos', 'alimentos', '🍔', 4),
('Salud y Belleza', 'salud-belleza', '💊', 5),
('Entretenimiento', 'entretenimiento', '🎮', 6),
('Viajes', 'viajes', '✈️', 7),
('Deportes', 'deportes', '⚽', 8);

-- Stores Table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals Table
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- In real Supabase Auth, this usually references auth.users, but we use our users table for profile info
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(10,2),
    deal_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    deal_url TEXT NOT NULL,
    image_urls JSONB DEFAULT '[]',
    deal_type VARCHAR(20) DEFAULT 'deal' CHECK (deal_type IN ('deal', 'coupon', 'discussion')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deals_category ON deals(category_id);
CREATE INDEX idx_deals_user ON deals(user_id);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX idx_deals_discount ON deals(discount_percentage DESC);
CREATE INDEX idx_deals_status ON deals(status) WHERE status = 'active';

-- Votes Table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deal_id)
);

CREATE INDEX idx_votes_deal ON votes(deal_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saves Table
CREATE TABLE saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic read access for anonymous users
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view stores" ON stores
    FOR SELECT USING (true);

-- Authenticated users policies (Note: These assume we link Supabase Auth ID to our users table ID, or we need a trigger to sync them. For simplicity, we'll assume the application handles the mapping or we use auth.uid() directly if we change the schema. For this schema, we need to ensure the user_id in tables matches the auth.uid())

-- We will assume that the 'users' table is a public profile table and its ID matches auth.users.id
-- Trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists to avoid error on multiple runs (optional, but good practice)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Policies for Deals
CREATE POLICY "Authenticated users can create deals" ON deals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals" ON deals
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Votes
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE USING (auth.uid() = user_id);
    
-- Policies for Comments
CREATE POLICY "Authenticated users can comment" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for Users (Profiles)
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON deals TO anon;
GRANT ALL ON deals TO authenticated;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON stores TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON votes TO anon;

GRANT ALL ON comments TO authenticated;
GRANT ALL ON votes TO authenticated;
GRANT ALL ON saves TO authenticated;


-- 
-- End of 20240227000000_init_schema.sql
-- 

-- 
-- Start of 20240227000001_create_storage.sql
-- 


-- Create storage bucket for deals
insert into storage.buckets (id, name, public)
values ('deals', 'deals', true)
on conflict (id) do nothing;

-- Set up access policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'deals' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'deals' and auth.role() = 'authenticated' );


-- 
-- End of 20240227000001_create_storage.sql
-- 

-- 
-- Start of 20240310_reputation_transfers.sql
-- 

create table if not exists public.reputation_transfers (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  amount integer not null check (amount in (1, 3, 5)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_sender_receiver unique (sender_id, receiver_id),
  constraint self_transfer_check check (sender_id != receiver_id)
);

-- Add RLS policies
alter table public.reputation_transfers enable row level security;

create policy "Users can view all reputation transfers"
  on public.reputation_transfers for select
  using (true);

create policy "Users can insert their own transfers"
  on public.reputation_transfers for insert
  with check (auth.uid() = sender_id);


-- 
-- End of 20240310_reputation_transfers.sql
-- 

-- 
-- Start of 20240310_transfer_rpc.sql
-- 

create or replace function transfer_reputation_points(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_amount integer
) returns void as $$
declare
  v_sender_points integer;
begin
  -- Check amount validity
  if p_amount not in (1, 3, 5) then
    raise exception 'Invalid amount';
  end if;

  -- Check self-transfer
  if p_sender_id = p_receiver_id then
    raise exception 'Cannot transfer points to self';
  end if;

  -- Check if already transferred
  if exists (select 1 from public.reputation_transfers where sender_id = p_sender_id and receiver_id = p_receiver_id) then
    raise exception 'Already transferred points to this user';
  end if;

  -- Check sender balance
  select karma_points into v_sender_points from public.users where id = p_sender_id;
  if v_sender_points < p_amount then
    raise exception 'Insufficient points';
  end if;

  -- Deduct from sender
  update public.users set karma_points = karma_points - p_amount where id = p_sender_id;

  -- Add to receiver
  update public.users set karma_points = karma_points + p_amount where id = p_receiver_id;

  -- Log transfer
  insert into public.reputation_transfers (sender_id, receiver_id, amount)
  values (p_sender_id, p_receiver_id, p_amount);
end;
$$ language plpgsql security definer;


-- 
-- End of 20240310_transfer_rpc.sql
-- 

-- 
-- Start of 20260227000002_add_parent_id_to_comments.sql
-- 

-- Add parent_id column to support threaded replies in comments
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);



-- 
-- End of 20260227000002_add_parent_id_to_comments.sql
-- 

-- 
-- Start of 20260227000003_fix_comments_rls.sql
-- 

-- Copia y pega todo este contenido en el SQL Editor de tu proyecto Supabase para arreglar los permisos de comentarios

-- 1. Asegurar que RLS está activo
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas anteriores para evitar errores de "ya existe"
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Public comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated insert" ON public.comments;

-- 3. Crear política de LECTURA (SELECT) para todos (público)
-- Esto permite que cualquiera vea los comentarios, incluso sin loguearse
CREATE POLICY "Comments are viewable by everyone"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Crear política de INSERCIÓN (INSERT) para usuarios autenticados
-- Esto permite crear comentarios SOLO si el user_id coincide con tu usuario actual
CREATE POLICY "Authenticated users can comment"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Crear políticas de EDICIÓN/BORRADO (UPDATE/DELETE) para dueños
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 
-- End of 20260227000003_fix_comments_rls.sql
-- 

-- 
-- Start of 20260227000004_add_comment_votes_and_reports.sql
-- 

-- Create comment_votes table
CREATE TABLE comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);

-- Enable RLS
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Policies for Comment Votes
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment votes" ON comment_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment votes" ON comment_votes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment votes" ON comment_votes
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON comment_votes TO authenticated;
GRANT SELECT ON comment_votes TO anon;




-- 
-- End of 20260227000004_add_comment_votes_and_reports.sql
-- 

-- 
-- Start of 20260227000005_add_change_count_to_votes.sql
-- 

-- Add change_count column to track vote changes
ALTER TABLE public.comment_votes 
ADD COLUMN IF NOT EXISTS change_count INTEGER DEFAULT 0;


-- 
-- End of 20260227000005_add_change_count_to_votes.sql
-- 

-- 
-- Start of 20260228000000_add_deal_fields.sql
-- 


-- Modificar la tabla deals para agregar los nuevos campos
ALTER TABLE deals
ADD COLUMN coupon_code TEXT,
ADD COLUMN availability TEXT CHECK (availability IN ('online', 'in_store')),
ADD COLUMN shipping_cost DECIMAL(10, 2),
ADD COLUMN shipping_country TEXT, -- Podría ser un array o una tabla relacionada, por simplicidad TEXT por ahora
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;

-- Asegurar que expires_at ya existe, si no, agregarlo (ya existe en el esquema actual)
-- ALTER TABLE deals ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;


-- 
-- End of 20260228000000_add_deal_fields.sql
-- 

-- 
-- Start of 20260228000001_add_votes_logic.sql
-- 

-- 1. Asegurar que la tabla votes existe
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deal_id)
);

-- 2. Habilitar RLS en votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad para votes
-- Eliminar políticas existentes para evitar conflictos si ya existen
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;

CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON public.votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON public.votes
    FOR SELECT USING (true);

-- 4. Agregar columna votes_count a deals si no existe
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;

-- 5. Función para actualizar el conteo de votos
CREATE OR REPLACE FUNCTION public.handle_vote_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso: Insertar nuevo voto
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count + 1 WHERE id = NEW.deal_id;
        ELSIF (NEW.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count - 1 WHERE id = NEW.deal_id;
        END IF;
        RETURN NEW;
    
    -- Caso: Borrar voto existente
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count - 1 WHERE id = OLD.deal_id;
        ELSIF (OLD.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count + 1 WHERE id = OLD.deal_id;
        END IF;
        RETURN OLD;

    -- Caso: Cambiar voto (Update)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Si cambia de hot a cold: -1 (quitar hot) -1 (poner cold) = -2
        IF (OLD.vote_type = 'hot' AND NEW.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count - 2 WHERE id = NEW.deal_id;
        -- Si cambia de cold a hot: +1 (quitar cold) +1 (poner hot) = +2
        ELSIF (OLD.vote_type = 'cold' AND NEW.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count + 2 WHERE id = NEW.deal_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE PROCEDURE public.handle_vote_update();

-- 7. Grant permissions
GRANT ALL ON public.votes TO authenticated;
GRANT SELECT ON public.votes TO anon;


-- 
-- End of 20260228000001_add_votes_logic.sql
-- 

-- 
-- Start of 20260228000006_moderation_system.sql
-- 

-- Update deals table for moderation status
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE deals ADD CONSTRAINT deals_status_check 
    CHECK (status IN ('active', 'expired', 'deleted', 'pending', 'rejected', 'revision'));

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Create referral patterns table
CREATE TABLE IF NOT EXISTS referral_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL, -- 'approve_post', 'reject_post', 'ban_user', 'add_pattern', etc.
    target_id UUID, -- ID of the deal, user, or pattern
    target_type VARCHAR(20) NOT NULL, -- 'deal', 'user', 'pattern'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'post_approved', 'post_rejected', 'system_alert'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update users table for banning
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_status_moderation ON deals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs(admin_id);

-- RPC Function for Karma Points
CREATE OR REPLACE FUNCTION increment_karma(row_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET karma_points = COALESCE(karma_points, 0) + amount
  WHERE id = row_id;
END;
$$;

-- RLS Policies

-- Referral Patterns: Only admins/mods can view/edit
ALTER TABLE referral_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral patterns" ON referral_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Moderation Logs: Only admins can view
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
    
CREATE POLICY "Admins/Mods can insert logs" ON moderation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Notifications: Users can view their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        -- Allow system (service role) or admins to insert
        -- For simplicity, we allow authenticated users to trigger notifications via server functions
        -- ideally this is done via a secure function or service role
        true 
    );
    
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);


-- 
-- End of 20260228000006_moderation_system.sql
-- 

-- 
-- Start of 20260228000007_create_reports_table.sql
-- 

-- Create reports table
DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_id UUID NOT NULL, -- can be deal_id or comment_id
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('deal', 'comment')),
    reason VARCHAR(50) NOT NULL, -- e.g., 'spam', 'offensive', 'fake', 'other'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_id, target_type);

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create reports
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins/Moderators can view and update reports
CREATE POLICY "Admins/Mods can view reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins/Mods can update reports" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );


-- 
-- End of 20260228000007_create_reports_table.sql
-- 

-- 
-- Start of 20260228000008_create_forbidden_words.sql
-- 


CREATE TABLE IF NOT EXISTS forbidden_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE forbidden_words ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view forbidden words" ON forbidden_words
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert forbidden words" ON forbidden_words
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete forbidden words" ON forbidden_words
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Also allow authenticated users to read (for client-side validation if needed, though server-side is safer)
-- Actually, better to keep it server-side or accessible via a specific function to avoid leaking the list easily?
-- For now, let's allow read for all authenticated users so we can validate in the client if we want to give immediate feedback.
CREATE POLICY "Authenticated users can view forbidden words" ON forbidden_words
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- 
-- End of 20260228000008_create_forbidden_words.sql
-- 

-- 
-- Start of 20260228000009_fix_deals_visibility.sql
-- 

-- Fix RLS policies to allow admins/moderators to view all deals
-- and users to view their own deals regardless of status.

-- Drop existing restrictive policy if it exists (it was created in 20240227000000_init_schema.sql)
DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;

-- Recreate "Anyone can view active deals" (same as before, but ensuring it's there)
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

-- Allow Admins and Moderators to view ALL deals
CREATE POLICY "Admins and Moderators can view all deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Allow Users to view their OWN deals (regardless of status)
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (auth.uid() = user_id);

-- Update existing pending deals to active to make them visible immediately
-- (Since the user wants everyone to see the content)
UPDATE deals SET status = 'active' WHERE status = 'pending';


-- 
-- End of 20260228000009_fix_deals_visibility.sql
-- 

-- 
-- Start of 20260228000010_fix_all_permissions.sql
-- 

-- FIX ALL PERMISSIONS AND POLICIES
-- Run this script to fix "Error fetching deals" and visibility issues.

-- 1. DEALS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;

-- Anyone can see active deals
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

-- Admins/Mods see everything
CREATE POLICY "Admins and Moderators can view all deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Users see their own deals (even if pending/rejected)
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (auth.uid() = user_id);

-- Update status to ensure visibility
UPDATE deals SET status = 'active' WHERE status = 'pending';


-- 2. COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
-- Drop potentially conflicting policies from other migrations
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "Authenticated insert" ON comments;

-- Everyone can view comments (CRITICAL for comments(count) to work)
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can comment
CREATE POLICY "Authenticated users can comment" ON comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users manage their own comments
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3. VOTES
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deal_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;

-- Everyone can view votes
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can vote
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- 4. USERS (Profiles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Everyone can view profiles (needed to see who posted the deal)
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);


-- 5. STORES & CATEGORIES
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "Anyone can view stores" ON stores
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT TO anon, authenticated USING (true);


-- 
-- End of 20260228000010_fix_all_permissions.sql
-- 

-- 
-- Start of 20260228000011_disable_rls_emergency.sql
-- 

-- EMERGENCY: DISABLE RLS TO RESTORE VISIBILITY
-- Run this script to immediately make all content visible while we debug permissions.

-- Disable RLS on main tables
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Ensure all deals are active (just in case)
UPDATE deals SET status = 'active' WHERE status = 'pending';


-- 
-- End of 20260228000011_disable_rls_emergency.sql
-- 

-- 
-- Start of 20260228000012_restore_security.sql
-- 

-- RESTORE AND FIX SECURITY (RLS)
-- This script re-enables RLS and sets correct policies for all tables.

-- 1. DEALS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;
DROP POLICY IF EXISTS "Users can update own deals" ON deals;

-- Anyone can see active deals
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

-- Admins/Mods see everything
CREATE POLICY "Admins and Moderators can view all deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Users see their own deals (even if pending/rejected)
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create deals
CREATE POLICY "Authenticated users can create deals" ON deals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own deals
CREATE POLICY "Users can update own deals" ON deals
    FOR UPDATE USING (auth.uid() = user_id);


-- 2. COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "Authenticated insert" ON comments;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can comment
CREATE POLICY "Authenticated users can comment" ON comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users manage their own comments
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3. VOTES
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;

-- Everyone can view votes
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can vote
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON votes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 4. USERS (Profiles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT TO anon, authenticated USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);


-- 5. STORES & CATEGORIES
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "Anyone can view stores" ON stores
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT TO anon, authenticated USING (true);

-- 6. SAVES
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saves" ON saves;
DROP POLICY IF EXISTS "Users can create saves" ON saves;
DROP POLICY IF EXISTS "Users can delete saves" ON saves;

CREATE POLICY "Users can view own saves" ON saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create saves" ON saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saves" ON saves
    FOR DELETE USING (auth.uid() = user_id);


-- 7. REPORTS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

CREATE POLICY "Admins can view reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- 8. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Ideally restricted to service role, but open for now for function triggers

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);



-- 
-- End of 20260228000012_restore_security.sql
-- 

-- 
-- Start of 20260228000013_fix_reports_table.sql
-- 

-- Fix missing columns in reports table
-- and restore permissions for reports

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_id UUID NOT NULL, 
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('deal', 'comment')),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- Ensure reporter_id column exists (if table already existed without it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'reporter_id') THEN
        ALTER TABLE reports ADD COLUMN reporter_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

CREATE POLICY "Admins can view reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- 
-- End of 20260228000013_fix_reports_table.sql
-- 

-- 
-- Start of 20260301000000_security_hardening.sql
-- 

-- SECURITY HARDENING MIGRATION
-- 1. Prevent Privilege Escalation (Users changing their own role)
-- 2. Enforce Deal Status (Prevent bypassing moderation)

-- 1. PREVENT ROLE CHANGES
-- Create a trigger to prevent non-admins from changing their role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the user is an admin (we need to query the table itself or rely on auth.jwt() claims if role was there, but here role is in the table)
    -- However, inside a trigger, we can't easily check the *requesting* user's role if it's the same table being updated, unless we trust the OLD.role.
    -- But if I am an admin, I can change others' roles.
    -- If I am a user, I should not be able to change my role.
    
    -- Better approach: Check auth.uid()
    -- If the user is updating their own record (auth.uid() = id), they cannot change role.
    -- Admins updating other users (auth.uid() != id) is allowed (assuming RLS allows it).
    
    IF auth.uid() = NEW.id THEN
       -- User updating themselves
       IF NEW.role != OLD.role THEN
           RAISE EXCEPTION 'You cannot change your own role.';
       END IF;
    END IF;
    
    -- What if an admin wants to demote themselves? Maybe allow that? 
    -- For now, strict: No self-promotion.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_change();


-- 2. ENFORCE DEAL STATUS
-- Create a trigger to force status to 'pending' for non-admins
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  -- Check if the current user is admin or moderator
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  -- If not staff, force status to pending on INSERT
  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      -- If updating critical fields, reset to pending?
      -- Let's say if title, description, url, price, image changes.
      -- For now, let's just prevent them from setting 'active' if it was 'pending' or 'rejected'.
      
      -- If they try to set status to 'active', block it or revert it.
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
         NEW.status := 'pending'; -- Or keep OLD.status? Pending is safer.
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;
CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();


-- 
-- End of 20260301000000_security_hardening.sql
-- 

-- 
-- Start of 20260301000001_gamification_system.sql
-- 

-- Gamification System Tables

-- 1. Levels Table
CREATE TABLE IF NOT EXISTS gamification_levels (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    referral_limit INTEGER NOT NULL,
    title VARCHAR(50) NOT NULL,
    icon_url TEXT
);

-- Seed Levels (Formula: Previous + Level * 100 or similar, manually adjusted for smooth progression)
INSERT INTO gamification_levels (level, xp_required, referral_limit, title) VALUES
(1, 0, 2, 'Novato'),
(2, 100, 2, 'Aprendiz'),
(3, 250, 2, 'Explorador'),
(4, 500, 2, 'Entusiasta'),
(5, 800, 2, 'Habitual'),
(6, 1200, 2, 'Veterano'),
(7, 1700, 2, 'Experto'),
(8, 2300, 2, 'Maestro'),
(9, 3000, 2, 'Leyenda'),
(10, 4000, 5, 'Mítico'),
(11, 5500, 5, 'Titán'),
(12, 7000, 5, 'Semidiós'),
(13, 9000, 5, 'Divino'),
(14, 11000, 5, 'Inmortal'),
(15, 14000, 5, 'Omnipresente'),
(16, 17000, 5, 'Eterno'),
(17, 21000, 5, 'Infinito'),
(18, 25000, 5, 'Supremo'),
(19, 30000, 5, 'Universal'),
(20, 36000, 10, 'Cósmico'),
(21, 43000, 10, 'Trascendente'),
(22, 50000, 10, 'Iluminado'),
(23, 60000, 10, 'Soberano'),
(24, 70000, 10, 'Majestuoso'),
(25, 80000, 10, 'Imperial'),
(26, 95000, 10, 'Celestial'),
(27, 110000, 10, 'Galáctico'),
(28, 130000, 10, 'Estelar'),
(29, 150000, 10, 'Nebular'),
(30, 175000, 10, 'Cuántico'),
(31, 200000, 10, 'Dimensional'),
(32, 230000, 10, 'Temporal'),
(33, 260000, 10, 'Eterno II'),
(34, 300000, 10, 'Infinito II'),
(35, 340000, 10, 'Supremo II'),
(36, 390000, 10, 'Universal II'),
(37, 440000, 10, 'Cósmico II'),
(38, 500000, 10, 'Trascendente II'),
(39, 560000, 10, 'Iluminado II'),
(40, 630000, 10, 'Soberano II'),
(41, 700000, 10, 'Majestuoso II'),
(42, 780000, 10, 'Imperial II'),
(43, 860000, 10, 'Celestial II'),
(44, 950000, 10, 'Galáctico II'),
(45, 1050000, 10, 'Estelar II'),
(46, 1150000, 10, 'Nebular II'),
(47, 1260000, 10, 'Cuántico II'),
(48, 1380000, 10, 'Dimensional II'),
(49, 1500000, 10, 'Temporal II'),
(50, 1630000, 10, 'Omega'),
(80, 5000000, 20, 'Alpha Omega') -- Jump to level 80 for the requirement
ON CONFLICT (level) DO NOTHING;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS gamification_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1 REFERENCES gamification_levels(level),
    current_xp INTEGER NOT NULL DEFAULT 0,
    next_level_xp INTEGER NOT NULL DEFAULT 100,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamification_profiles_level ON gamification_profiles(current_level);
CREATE INDEX idx_gamification_profiles_xp ON gamification_profiles(current_xp DESC);

-- 3. Badges Table
CREATE TABLE IF NOT EXISTS gamification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Badges
INSERT INTO gamification_badges (slug, name, description, xp_reward, category) VALUES
('first_post', 'Primera Publicación', 'Has publicado tu primera oferta.', 50, 'posting'),
('first_comment', 'Primer Comentario', 'Has comentado por primera vez.', 20, 'social'),
('popular', 'Popular', 'Tu publicación alcanzó 100 votos.', 200, 'posting'),
('influencer', 'Influencer', 'Has referido a 5 usuarios.', 500, 'social'),
('verified', 'Verificado', 'Has verificado tu cuenta.', 100, 'general')
ON CONFLICT (slug) DO NOTHING;

-- 4. User Badges Table
CREATE TABLE IF NOT EXISTS gamification_user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES gamification_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, badge_id)
);

-- 5. XP History Table
CREATE TABLE IF NOT EXISTS gamification_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamification_xp_history_user ON gamification_xp_history(user_id);

-- 6. Referrals Tracking Table
CREATE TABLE IF NOT EXISTS gamification_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

CREATE INDEX idx_gamification_referrals_referrer ON gamification_referrals(referrer_id);

-- 7. Functions and Triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.gamification_profiles (user_id, referral_code, next_level_xp)
  VALUES (
      new.id, 
      upper(substring(md5(random()::text) from 1 for 8)),
      (SELECT xp_required FROM gamification_levels WHERE level = 2)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_user_created_gamification ON public.users;
CREATE TRIGGER on_user_created_gamification
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_gamification();

-- Initialize existing users if any
INSERT INTO gamification_profiles (user_id, referral_code, next_level_xp)
SELECT 
    id, 
    upper(substring(md5(random()::text) from 1 for 8)),
    (SELECT xp_required FROM gamification_levels WHERE level = 2)
FROM users
WHERE id NOT IN (SELECT user_id FROM gamification_profiles);

-- Function to Add XP
CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_type VARCHAR,
    p_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_next_level_xp INTEGER;
    v_xp_required_for_next INTEGER;
    v_leveled_up BOOLEAN := FALSE;
    v_new_level INTEGER;
BEGIN
    -- Get current state
    SELECT current_xp, current_level INTO v_current_xp, v_current_level
    FROM gamification_profiles
    WHERE user_id = p_user_id;
    
    IF v_current_xp IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Update XP
    v_current_xp := v_current_xp + p_amount;
    
    UPDATE gamification_profiles
    SET current_xp = v_current_xp,
        last_activity_date = NOW()
    WHERE user_id = p_user_id;

    -- Log History
    INSERT INTO gamification_xp_history (user_id, amount, source_type, source_id)
    VALUES (p_user_id, p_amount, p_source_type, p_source_id);

    -- Check for level up
    LOOP
        SELECT xp_required INTO v_xp_required_for_next
        FROM gamification_levels
        WHERE level = v_current_level + 1;

        IF v_xp_required_for_next IS NULL THEN
            EXIT; -- Max level
        END IF;

        IF v_current_xp >= v_xp_required_for_next THEN
            v_current_level := v_current_level + 1;
            v_leveled_up := TRUE;
            
            -- Grant badges or other rewards here if needed
            
            UPDATE gamification_profiles
            SET current_level = v_current_level,
                next_level_xp = (SELECT xp_required FROM gamification_levels WHERE level = v_current_level + 1)
            WHERE user_id = p_user_id;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'new_xp', v_current_xp,
        'new_level', v_current_level,
        'leveled_up', v_leveled_up
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

ALTER TABLE gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view levels" ON gamification_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view gamification profiles" ON gamification_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON gamification_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view user badges" ON gamification_user_badges FOR SELECT USING (true);
CREATE POLICY "Users can view own xp history" ON gamification_xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON gamification_referrals FOR SELECT USING (auth.uid() = referrer_id);


-- 
-- End of 20260301000001_gamification_system.sql
-- 

-- 
-- Start of 20260301000002_gamification_logic.sql
-- 

-- Gamification Logic: Functions and Triggers

-- 1. Leaderboard Function
CREATE OR REPLACE FUNCTION get_leaderboard(period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    total_xp BIGINT,
    current_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(SUM(h.amount), 0) as total_xp,
        p.current_level
    FROM 
        users u
    JOIN 
        gamification_profiles p ON u.id = p.user_id
    LEFT JOIN 
        gamification_xp_history h ON u.id = h.user_id
    WHERE 
        (period_start IS NULL OR h.created_at >= period_start)
    GROUP BY 
        u.id, u.username, u.avatar_url, p.current_level
    ORDER BY 
        total_xp DESC
    LIMIT 
        limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Badge Check Functions

-- Trigger for First Post Badge
CREATE OR REPLACE FUNCTION check_post_badges()
RETURNS trigger AS $$
DECLARE
    v_post_count INTEGER;
    v_badge_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := new.user_id;
    
    -- Count posts
    SELECT count(*) INTO v_post_count FROM deals WHERE user_id = v_user_id;
    
    -- First Post Badge
    IF v_post_count = 1 THEN
        SELECT id INTO v_badge_id FROM gamification_badges WHERE slug = 'first_post';
        IF v_badge_id IS NOT NULL THEN
            INSERT INTO gamification_user_badges (user_id, badge_id)
            VALUES (v_user_id, v_badge_id)
            ON CONFLICT DO NOTHING;
            
            -- Award XP for badge
            PERFORM add_xp(v_user_id, (SELECT xp_reward FROM gamification_badges WHERE id = v_badge_id), 'badge', v_badge_id);
        END IF;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_created_badges ON deals;
CREATE TRIGGER on_post_created_badges
    AFTER INSERT ON deals
    FOR EACH ROW EXECUTE PROCEDURE check_post_badges();

-- Trigger for First Comment Badge
CREATE OR REPLACE FUNCTION check_comment_badges()
RETURNS trigger AS $$
DECLARE
    v_comment_count INTEGER;
    v_badge_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := new.user_id;
    
    -- Count comments
    SELECT count(*) INTO v_comment_count FROM comments WHERE user_id = v_user_id;
    
    -- First Comment Badge
    IF v_comment_count = 1 THEN
        SELECT id INTO v_badge_id FROM gamification_badges WHERE slug = 'first_comment';
        IF v_badge_id IS NOT NULL THEN
            INSERT INTO gamification_user_badges (user_id, badge_id)
            VALUES (v_user_id, v_badge_id)
            ON CONFLICT DO NOTHING;
            
             -- Award XP for badge
            PERFORM add_xp(v_user_id, (SELECT xp_reward FROM gamification_badges WHERE id = v_badge_id), 'badge', v_badge_id);
        END IF;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_badges ON comments;
CREATE TRIGGER on_comment_created_badges
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE PROCEDURE check_comment_badges();

-- 3. XP Awarding Triggers

-- Trigger to award XP for new Deal
CREATE OR REPLACE FUNCTION award_xp_new_deal()
RETURNS trigger AS $$
BEGIN
    PERFORM add_xp(new.user_id, 50, 'post', new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_created_xp ON deals;
CREATE TRIGGER on_deal_created_xp
    AFTER INSERT ON deals
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_deal();

-- Trigger to award XP for new Comment
CREATE OR REPLACE FUNCTION award_xp_new_comment()
RETURNS trigger AS $$
BEGIN
    PERFORM add_xp(new.user_id, 10, 'comment', new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_xp ON comments;
CREATE TRIGGER on_comment_created_xp
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_comment();
    
-- Trigger to award XP for Voting
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        PERFORM add_xp(new.user_id, 2, 'vote', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_created_xp ON votes;
CREATE TRIGGER on_vote_created_xp
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_vote();


-- 
-- End of 20260301000002_gamification_logic.sql
-- 

-- 
-- Start of 20260301000003_referral_limits.sql
-- 

-- Add is_referral column to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_referral BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_deals_is_referral ON deals(is_referral);

-- Update Level Limits
-- Level 1-9: 0 referrals
UPDATE gamification_levels SET referral_limit = 0 WHERE level < 10;

-- Level 10-19: 2 referrals
UPDATE gamification_levels SET referral_limit = 2 WHERE level BETWEEN 10 AND 19;

-- Level 20-49: 10 referrals (keeping previous scale starting from 20)
UPDATE gamification_levels SET referral_limit = 10 WHERE level BETWEEN 20 AND 49;

-- Level 50+: 20 referrals (or whatever the max was)
UPDATE gamification_levels SET referral_limit = 20 WHERE level >= 50;


-- 
-- End of 20260301000003_referral_limits.sql
-- 

-- 
-- Start of 20260301000004_update_badge_icons.sql
-- 

-- Update badge icon URLs
UPDATE gamification_badges SET icon_url = '/badges/first_post.svg' WHERE slug = 'first_post';
UPDATE gamification_badges SET icon_url = '/badges/first_comment.svg' WHERE slug = 'first_comment';
UPDATE gamification_badges SET icon_url = '/badges/popular.svg' WHERE slug = 'popular';
UPDATE gamification_badges SET icon_url = '/badges/influencer.svg' WHERE slug = 'influencer';
UPDATE gamification_badges SET icon_url = '/badges/verified.svg' WHERE slug = 'verified';


-- 
-- End of 20260301000004_update_badge_icons.sql
-- 

-- 
-- Start of 20260301000005_gamification_security.sql
-- 

-- Gamification Security & Negative XP Logic

-- Function to Remove XP
CREATE OR REPLACE FUNCTION remove_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_type VARCHAR,
    p_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_xp INTEGER;
BEGIN
    -- Get current state
    SELECT current_xp, current_level INTO v_current_xp, v_current_level
    FROM gamification_profiles
    WHERE user_id = p_user_id;
    
    IF v_current_xp IS NULL THEN
        -- If profile doesn't exist, ignore (should not happen for active users)
        RETURN jsonb_build_object('success', false);
    END IF;

    -- Calculate new XP (allow negative for calculation, but floor at 0 in update if desired)
    -- For now, we allow XP to drop.
    v_new_xp := GREATEST(0, v_current_xp - p_amount);
    
    UPDATE gamification_profiles
    SET current_xp = v_new_xp
    WHERE user_id = p_user_id;

    -- Log History (Negative amount)
    INSERT INTO gamification_xp_history (user_id, amount, source_type, source_id)
    VALUES (p_user_id, -p_amount, p_source_type, p_source_id);

    -- NOTE: We are NOT implementing de-leveling logic for simplicity and user experience.
    -- Users keep their level even if XP drops below threshold, but they must earn back XP to progress.
    -- This prevents "yo-yo" leveling effects.

    RETURN jsonb_build_object(
        'new_xp', v_new_xp,
        'removed_amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Trigger for Removing Vote (Unlike/Unvote)
CREATE OR REPLACE FUNCTION reverse_xp_vote_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 2 XP when a vote is deleted
    PERFORM remove_xp(old.user_id, 2, 'vote_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_deleted_xp ON votes;
CREATE TRIGGER on_vote_deleted_xp
    AFTER DELETE ON votes
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_vote_removed();


-- 2. Trigger for Removing Comment
CREATE OR REPLACE FUNCTION reverse_xp_comment_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 10 XP when a comment is deleted
    PERFORM remove_xp(old.user_id, 10, 'comment_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_deleted_xp ON comments;
CREATE TRIGGER on_comment_deleted_xp
    AFTER DELETE ON comments
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_comment_removed();


-- 3. Trigger for Removing Deal (Optional but recommended for consistency)
CREATE OR REPLACE FUNCTION reverse_xp_deal_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 50 XP when a deal is deleted
    PERFORM remove_xp(old.user_id, 50, 'post_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_deleted_xp ON deals;
CREATE TRIGGER on_deal_deleted_xp
    AFTER DELETE ON deals
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_deal_removed();


-- 
-- End of 20260301000005_gamification_security.sql
-- 

-- 
-- Start of 20260301000006_gamification_streaks_limits.sql
-- 

-- Gamification Updates: Streaks & Limits

-- 1. Daily Streaks Table
CREATE TABLE IF NOT EXISTS gamification_daily_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Users can view own streaks" ON gamification_daily_streaks FOR SELECT USING (auth.uid() = user_id);

-- 2. Function to Claim Daily Bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_last_login DATE;
    v_current_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_bonus_xp INTEGER;
    v_streak_updated BOOLEAN := FALSE;
BEGIN
    -- Get current streak info
    SELECT last_login_date, current_streak INTO v_last_login, v_current_streak
    FROM gamification_daily_streaks
    WHERE user_id = p_user_id;

    -- Initialize if not exists
    IF v_last_login IS NULL THEN
        INSERT INTO gamification_daily_streaks (user_id, current_streak, last_login_date)
        VALUES (p_user_id, 1, v_today);
        
        v_current_streak := 1;
        v_bonus_xp := 10; -- First day bonus
        PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', 1,
            'xp_awarded', v_bonus_xp,
            'message', '¡Primer día! Has ganado 10 XP.'
        );
    END IF;

    -- Check if already claimed today
    IF v_last_login = v_today THEN
        RETURN jsonb_build_object(
            'success', false,
            'streak', v_current_streak,
            'xp_awarded', 0,
            'message', 'Ya has reclamado tu bonus hoy.'
        );
    END IF;

    -- Check if streak continues (login was yesterday)
    IF v_last_login = v_today - 1 THEN
        v_current_streak := LEAST(10, v_current_streak + 1); -- Cap streak multiplier at 10
    ELSE
        -- Streak broken
        v_current_streak := 1;
    END IF;

    -- Calculate XP: Base 10 * Streak (Max 100 XP)
    v_bonus_xp := 10 * v_current_streak;

    -- Update Streak
    UPDATE gamification_daily_streaks
    SET current_streak = v_current_streak,
        last_login_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Award XP
    PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);

    RETURN jsonb_build_object(
        'success', true,
        'streak', v_current_streak,
        'xp_awarded', v_bonus_xp,
        'message', format('¡Racha de %s días! Has ganado %s XP.', v_current_streak, v_bonus_xp)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update Vote Trigger to Limit 5 XP-awarding votes per day
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
DECLARE
    v_today_votes INTEGER;
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        -- Count votes by this user today
        SELECT count(*) INTO v_today_votes
        FROM gamification_xp_history
        WHERE user_id = new.user_id
          AND source_type = 'vote'
          AND created_at >= CURRENT_DATE;
          
        -- Limit to 5 per day
        IF v_today_votes < 5 THEN
            PERFORM add_xp(new.user_id, 2, 'vote', new.id);
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger to ensure it uses the new function version
DROP TRIGGER IF EXISTS on_vote_created_xp ON votes;
CREATE TRIGGER on_vote_created_xp
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_vote();


-- 
-- End of 20260301000006_gamification_streaks_limits.sql
-- 

-- 
-- Start of 20260302000001_restore_moderation.sql
-- 


-- RESTORE MODERATION TRIGGER

-- 1. Recreate the function to enforce deal status
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
         NEW.status := 'pending';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger
DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;
CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();


-- 
-- End of 20260302000001_restore_moderation.sql
-- 

-- 
-- Start of 20260302000002_notification_trigger.sql
-- 


-- TRIGGER FOR DEAL STATUS NOTIFICATIONS

CREATE OR REPLACE FUNCTION public.notify_deal_status_change()
RETURNS trigger AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Case 1: Pending -> Active (Approved)
    IF OLD.status = 'pending' AND NEW.status = 'active' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'post_approved',
        '¡Tu oferta ha sido aprobada!',
        'Tu publicación "' || NEW.title || '" ya está visible para toda la comunidad.',
        '/oferta/' || NEW.id
      );
    END IF;

    -- Case 2: Pending -> Rejected
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'post_rejected',
        'Tu oferta ha sido rechazada',
        'Tu publicación "' || NEW.title || '" no cumple con nuestras normas. Revisa el motivo en tus publicaciones.',
        '/mis-publicaciones'
      );
    END IF;

    -- Case 3: Active -> Expired (Optional, maybe too noisy?)
    -- IF NEW.status = 'expired' THEN ... END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_deal_status_change ON deals;
CREATE TRIGGER trg_notify_deal_status_change
  AFTER UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_deal_status_change();


-- 
-- End of 20260302000002_notification_trigger.sql
-- 

-- 
-- Start of 20260302000003_adjust_gamification_values.sql
-- 

-- Adjust Gamification Values to slow down progression

-- 1. Update Level Requirements (Significant increase)
UPDATE gamification_levels SET xp_required = 0 WHERE level = 1;
UPDATE gamification_levels SET xp_required = 300 WHERE level = 2;
UPDATE gamification_levels SET xp_required = 800 WHERE level = 3;
UPDATE gamification_levels SET xp_required = 1500 WHERE level = 4;
UPDATE gamification_levels SET xp_required = 2500 WHERE level = 5;
UPDATE gamification_levels SET xp_required = 4000 WHERE level = 6;
UPDATE gamification_levels SET xp_required = 6000 WHERE level = 7;
UPDATE gamification_levels SET xp_required = 8500 WHERE level = 8;
UPDATE gamification_levels SET xp_required = 11500 WHERE level = 9;
UPDATE gamification_levels SET xp_required = 15000 WHERE level = 10;
UPDATE gamification_levels SET xp_required = 20000 WHERE level = 11;
UPDATE gamification_levels SET xp_required = 26000 WHERE level = 12;
UPDATE gamification_levels SET xp_required = 33000 WHERE level = 13;
UPDATE gamification_levels SET xp_required = 41000 WHERE level = 14;
UPDATE gamification_levels SET xp_required = 50000 WHERE level = 15;
-- Scale the rest
UPDATE gamification_levels SET xp_required = 60000 WHERE level = 16;
UPDATE gamification_levels SET xp_required = 72000 WHERE level = 17;
UPDATE gamification_levels SET xp_required = 85000 WHERE level = 18;
UPDATE gamification_levels SET xp_required = 100000 WHERE level = 19;
UPDATE gamification_levels SET xp_required = 120000 WHERE level = 20;

-- 2. Update Badge Rewards (Decrease XP)
UPDATE gamification_badges SET xp_reward = 30 WHERE slug = 'first_post';
UPDATE gamification_badges SET xp_reward = 10 WHERE slug = 'first_comment';
UPDATE gamification_badges SET xp_reward = 100 WHERE slug = 'popular';
UPDATE gamification_badges SET xp_reward = 200 WHERE slug = 'influencer';
UPDATE gamification_badges SET xp_reward = 50 WHERE slug = 'verified';

-- 3. Update XP Awarding Functions (Decrease XP & Add Limits)

-- New Deal: 50 -> 20 (Limit 3 per day)
CREATE OR REPLACE FUNCTION award_xp_new_deal()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Count posts by this user today
    SELECT count(*) INTO v_today_count
    FROM gamification_xp_history
    WHERE user_id = new.user_id
      AND source_type = 'post'
      AND created_at >= CURRENT_DATE;

    IF v_today_count < 3 THEN
        PERFORM add_xp(new.user_id, 20, 'post', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New Comment: 10 -> 5 (Limit 5 per day)
CREATE OR REPLACE FUNCTION award_xp_new_comment()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Count comments by this user today
    SELECT count(*) INTO v_today_count
    FROM gamification_xp_history
    WHERE user_id = new.user_id
      AND source_type = 'comment'
      AND created_at >= CURRENT_DATE;

    IF v_today_count < 5 THEN
        PERFORM add_xp(new.user_id, 5, 'comment', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New Vote: 2 -> 1 (Limit 10 per day)
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        -- Count votes by this user today
        SELECT count(*) INTO v_today_count
        FROM gamification_xp_history
        WHERE user_id = new.user_id
          AND source_type = 'vote'
          AND created_at >= CURRENT_DATE;
          
        -- Limit to 10 per day
        IF v_today_count < 10 THEN
            PERFORM add_xp(new.user_id, 1, 'vote', new.id);
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Streak Bonus (Decrease XP)
-- Base 10 -> 5. Max 100 -> 50.
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_last_login DATE;
    v_current_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_bonus_xp INTEGER;
BEGIN
    -- Get current streak info
    SELECT last_login_date, current_streak INTO v_last_login, v_current_streak
    FROM gamification_daily_streaks
    WHERE user_id = p_user_id;

    -- Initialize if not exists
    IF v_last_login IS NULL THEN
        INSERT INTO gamification_daily_streaks (user_id, current_streak, last_login_date)
        VALUES (p_user_id, 1, v_today);
        
        v_current_streak := 1;
        v_bonus_xp := 5; -- First day bonus (Reduced from 10)
        PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', 1,
            'xp_awarded', v_bonus_xp,
            'message', '¡Primer día! Has ganado 5 XP.'
        );
    END IF;

    -- Check if already claimed today
    IF v_last_login = v_today THEN
        RETURN jsonb_build_object(
            'success', false,
            'streak', v_current_streak,
            'xp_awarded', 0,
            'message', 'Ya has reclamado tu bonus hoy.'
        );
    END IF;

    -- Check if streak continues (login was yesterday)
    IF v_last_login = v_today - 1 THEN
        v_current_streak := LEAST(10, v_current_streak + 1); -- Cap streak multiplier at 10
    ELSE
        -- Streak broken
        v_current_streak := 1;
    END IF;

    -- Calculate XP: Base 5 * Streak (Max 50 XP)
    v_bonus_xp := 5 * v_current_streak;

    -- Update Streak
    UPDATE gamification_daily_streaks
    SET current_streak = v_current_streak,
        last_login_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Award XP
    PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);

    RETURN jsonb_build_object(
        'success', true,
        'streak', v_current_streak,
        'xp_awarded', v_bonus_xp,
        'message', format('¡Racha de %s días! Has ganado %s XP.', v_current_streak, v_bonus_xp)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add Deduction Logic (Fair Play)

-- Deduct for Deal Deletion
CREATE OR REPLACE FUNCTION deduct_xp_delete_deal()
RETURNS trigger AS $$
BEGIN
    -- Deduct 20 XP (same as award)
    PERFORM add_xp(old.user_id, -20, 'penalty_post_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_deleted_xp ON deals;
CREATE TRIGGER on_deal_deleted_xp
    BEFORE DELETE ON deals
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_deal();

-- Deduct for Comment Deletion
CREATE OR REPLACE FUNCTION deduct_xp_delete_comment()
RETURNS trigger AS $$
BEGIN
    -- Deduct 5 XP
    PERFORM add_xp(old.user_id, -5, 'penalty_comment_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_deleted_xp ON comments;
CREATE TRIGGER on_comment_deleted_xp
    BEFORE DELETE ON comments
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_comment();

-- Deduct for Vote Deletion (Unlike)
CREATE OR REPLACE FUNCTION deduct_xp_delete_vote()
RETURNS trigger AS $$
BEGIN
    -- Deduct 1 XP
    PERFORM add_xp(old.user_id, -1, 'penalty_vote_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_deleted_xp ON votes;
CREATE TRIGGER on_vote_deleted_xp
    BEFORE DELETE ON votes
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_vote();

-- 6. Update existing profiles to reflect new next_level_xp
UPDATE gamification_profiles p
SET next_level_xp = (
    SELECT xp_required 
    FROM gamification_levels l 
    WHERE l.level = p.current_level + 1
);


-- 
-- End of 20260302000003_adjust_gamification_values.sql
-- 

-- 
-- Start of 20260302000004_expanded_notifications.sql
-- 

-- Notifications System Expansion

-- 1. Notify on Comment Reply
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger AS $$
DECLARE
  v_parent_author_id UUID;
  v_deal_title TEXT;
  v_deal_id UUID;
BEGIN
  -- Check if it is a reply
  IF NEW.parent_id IS NOT NULL THEN
    -- Get parent comment author
    SELECT user_id INTO v_parent_author_id
    FROM comments
    WHERE id = NEW.parent_id;

    -- Get deal info
    SELECT title, id INTO v_deal_title, v_deal_id
    FROM deals
    WHERE id = NEW.deal_id;

    -- Notify only if not replying to self
    IF v_parent_author_id IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_parent_author_id,
        'comment_reply',
        'Alguien respondió a tu comentario',
        'Han respondido a tu comentario en "' || v_deal_title || '"',
        '/oferta/' || v_deal_id || '#comment-' || NEW.id
      );
    END IF;
  ELSE
    -- Optional: Notify deal author of new top-level comment (if not self)
    DECLARE
        v_deal_author_id UUID;
    BEGIN
        SELECT user_id, title INTO v_deal_author_id, v_deal_title
        FROM deals
        WHERE id = NEW.deal_id;
        
        IF v_deal_author_id IS DISTINCT FROM NEW.user_id THEN
             INSERT INTO public.notifications (user_id, type, title, message, link)
              VALUES (
                v_deal_author_id,
                'new_comment',
                'Nuevo comentario en tu oferta',
                'Alguien comentó en "' || v_deal_title || '"',
                '/oferta/' || NEW.deal_id || '#comment-' || NEW.id
              );
        END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_comment_reply ON comments;
CREATE TRIGGER trg_notify_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE PROCEDURE public.notify_comment_reply();


-- 2. Notify on Level Up
CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS trigger AS $$
BEGIN
  -- Check if level increased
  IF NEW.current_level > OLD.current_level THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'level_up',
      '¡Subiste de Nivel!',
      'Has alcanzado el Nivel ' || NEW.current_level || '. ¡Descubre tus nuevas ventajas!',
      '/logros'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_level_up ON gamification_profiles;
CREATE TRIGGER trg_notify_level_up
  AFTER UPDATE ON gamification_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.notify_level_up();


-- 3. Notify on Badge Earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS trigger AS $$
DECLARE
  v_badge_name TEXT;
BEGIN
  -- Get badge name
  SELECT name INTO v_badge_name
  FROM gamification_badges
  WHERE id = NEW.badge_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'badge_earned',
    '¡Nueva Insignia Desbloqueada!',
    'Has ganado la insignia "' || v_badge_name || '".',
    '/logros'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_badge_earned ON gamification_user_badges;
CREATE TRIGGER trg_notify_badge_earned
  AFTER INSERT ON gamification_user_badges
  FOR EACH ROW EXECUTE PROCEDURE public.notify_badge_earned();


-- 
-- End of 20260302000004_expanded_notifications.sql
-- 

-- 
-- Start of 20260302000005_add_location_type_and_stores.sql
-- 


-- Insert common stores if they don't exist
INSERT INTO stores (name, slug, is_verified) VALUES
('Amazon', 'amazon', true),
('Mercado Libre', 'mercado-libre', true),
('Sears', 'sears', true),
('Liverpool', 'liverpool', true),
('Miniso', 'miniso', true),
('Walmart', 'walmart', true),
('Coppel', 'coppel', true),
('Palacio de Hierro', 'palacio-de-hierro', true),
('Sam''s Club', 'sams-club', true),
('Costco', 'costco', true),
('AliExpress', 'aliexpress', true),
('Temu', 'temu', true),
('Shein', 'shein', true),
('Nike', 'nike', true),
('Adidas', 'adidas', true),
('Zara', 'zara', true),
('H&M', 'hm', true),
('Bershka', 'bershka', true),
('Pull&Bear', 'pull-and-bear', true),
('Oxxo', 'oxxo', true),
('7-Eleven', '7-eleven', true),
('Farmacias Guadalajara', 'farmacias-guadalajara', true),
('Farmacias del Ahorro', 'farmacias-del-ahorro', true),
('Soriana', 'soriana', true),
('Chedraui', 'chedraui', true),
('Bodega Aurrera', 'bodega-aurrera', true),
('Elektra', 'elektra', true),
('Sanborns', 'sanborns', true),
('Mixup', 'mixup', true),
('GamePlanet', 'gameplanet', true),
('Sony', 'sony', true),
('Samsung', 'samsung', true),
('Apple', 'apple', true),
('Microsoft', 'microsoft', true),
('Steam', 'steam', true),
('PlayStation', 'playstation', true),
('Xbox', 'xbox', true),
('Nintendo', 'nintendo', true),
('Epic Games', 'epic-games', true),
('Ubisoft', 'ubisoft', true),
('GOG', 'gog', true),
('Humble Bundle', 'humble-bundle', true),
('Green Man Gaming', 'green-man-gaming', true),
('Eneba', 'eneba', true),
('CDKeys', 'cdkeys', true),
('Instant Gaming', 'instant-gaming', true),
('Kinguin', 'kinguin', true),
('G2A', 'g2a', true)
ON CONFLICT (slug) DO NOTHING;


-- 
-- End of 20260302000005_add_location_type_and_stores.sql
-- 

-- 
-- Start of 20260302000006_fix_moderation_trigger.sql
-- 


-- 1. Asegurar que el estado por defecto sea 'pending'
ALTER TABLE deals ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Función para forzar el estado a pending si no es admin/moderador
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  -- Verificar si es admin o moderador consultando la tabla pública de usuarios
  -- Asumimos que auth.uid() coincide con users.id
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  -- Si NO es staff, forzamos reglas de moderación
  IF NOT is_staff OR is_staff IS NULL THEN
    
    IF TG_OP = 'INSERT' THEN
      -- Al crear, siempre pending
      NEW.status := 'pending';
      -- Limpiar campos de moderación por si acaso
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    
    ELSIF TG_OP = 'UPDATE' THEN
      -- Al actualizar:
      -- 1. Si intenta cambiar status a active/rejected -> forzar pending
      IF NEW.status IN ('active', 'rejected') AND OLD.status != NEW.status THEN
         NEW.status := 'pending';
      END IF;
      
      -- 2. Si edita campos sensibles de una oferta activa -> volver a pending
      -- (Opcional: descomentar si se desea re-moderación estricta en edición)
      -- IF OLD.status = 'active' AND (
      --    NEW.title != OLD.title OR 
      --    NEW.deal_price != OLD.deal_price OR
      --    NEW.deal_url != OLD.deal_url
      -- ) THEN
      --    NEW.status := 'pending';
      -- END IF;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;

CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();


-- 
-- End of 20260302000006_fix_moderation_trigger.sql
-- 

-- 
-- Start of 20260303000001_create_contact_messages.sql
-- 

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional, if user is logged in
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200), -- Optional
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45) -- IPv6 support
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- RLS Policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated users can create messages
CREATE POLICY "Anyone can create contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );


-- 
-- End of 20260303000001_create_contact_messages.sql
-- 

-- 
-- Start of 20260305000001_create_scraper_tables.sql
-- 


-- Create scraped_deals table
CREATE TABLE IF NOT EXISTS public.scraped_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('amazon', 'mercadolibre')),
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    currency TEXT DEFAULT 'MXN',
    image_url TEXT,
    url TEXT NOT NULL,
    description TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    raw_data JSONB,
    UNIQUE(source, external_id)
);

-- Create scraper_logs table
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation TEXT NOT NULL CHECK (operation IN ('search', 'url_scrape', 'publish')),
    source TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.scraped_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scraped_deals
-- Only admins and moderators can view and manage scraped deals
CREATE POLICY "Admins and moderators can view scraped deals"
    ON public.scraped_deals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can insert scraped deals"
    ON public.scraped_deals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can update scraped deals"
    ON public.scraped_deals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Create policies for scraper_logs
-- Only admins and moderators can view and insert logs
CREATE POLICY "Admins and moderators can view logs"
    ON public.scraper_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can insert logs"
    ON public.scraper_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );


-- 
-- End of 20260305000001_create_scraper_tables.sql
-- 

-- 
-- Start of 20260306000000_secure_notifications.sql
-- 

-- SECURE NOTIFICATIONS & AUTOMATE NEW DEAL ALERTS

-- 1. Create Trigger for NEW Deals (Insert)
CREATE OR REPLACE FUNCTION public.notify_new_deal()
RETURNS trigger AS $$
BEGIN
  -- Case 1: Created as Pending (Under Review)
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'system_alert',
      'Oferta en revisión',
      'Tu oferta "' || NEW.title || '" ha sido enviada y está siendo revisada por nuestro equipo.',
      '/mis-publicaciones'
    );
  END IF;

  -- Case 2: Created as Active (Auto-approved for admins/trusted)
  IF NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'post_approved',
      'Oferta publicada',
      'Tu oferta "' || NEW.title || '" ha sido publicada exitosamente.',
      '/oferta/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_deal ON deals;
CREATE TRIGGER trg_notify_new_deal
  AFTER INSERT ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_new_deal();


-- 2. Secure Notifications Table (Restrict INSERT)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;

CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );


-- 
-- End of 20260306000000_secure_notifications.sql
-- 

-- 
-- Start of 20260308000000_optimize_db.sql
-- 

-- Optimize Database Performance with Indexes

-- Deals Table Indexes
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_category_id ON deals(category_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_votes_count ON deals(votes_count DESC);

-- Comments Table Indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deal_id ON comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Votes Table Indexes
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_deal_id ON votes(deal_id);
CREATE INDEX IF NOT EXISTS idx_votes_composite ON votes(user_id, deal_id); -- For quick lookup of user vote on a deal

-- Notifications Table Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Gamification Indexes
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON gamification_xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON gamification_user_badges(user_id);

-- Search Optimization (GIN index for text search on title/description)
-- Assumes pg_trgm extension is enabled, if not we might skip or enable it.
-- Let's enable it just in case, it's standard for search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_description_trgm ON deals USING gin (description gin_trgm_ops);


-- 
-- End of 20260308000000_optimize_db.sql
-- 

-- 
-- Start of 20260308000001_add_shipping_type.sql
-- 


-- Add shipping_type column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS shipping_type text DEFAULT 'none';

-- Optional: Add check constraint for valid values
ALTER TABLE deals ADD CONSTRAINT deals_shipping_type_check CHECK (shipping_type IN ('none', 'free', 'prime', 'meliplus', 'full'));


-- 
-- End of 20260308000001_add_shipping_type.sql
-- 

-- 
-- Start of 20260308000002_add_paused_status.sql
-- 


-- Update status check constraint to include 'paused'
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE deals ADD CONSTRAINT deals_status_check CHECK (status::text = ANY (ARRAY['active', 'expired', 'deleted', 'pending', 'rejected', 'revision', 'paused']::text[]));


-- 
-- End of 20260308000002_add_paused_status.sql
-- 

-- 
-- Start of 20260309000001_fix_user_profiles_policy.sql
-- 

-- Allow everyone to view profiles (needed for comments to show user info)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT
    TO public
    USING (true);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

GRANT SELECT ON users TO anon, authenticated, service_role;


-- 
-- End of 20260309000001_fix_user_profiles_policy.sql
-- 

-- 
-- Start of 20260309000002_fix_registration_and_cleanup.sql
-- 

-- Fix User Registration and Cleanup Database
-- This migration addresses "Database error saving new user" and profile visibility issues.

-- 1. CLEANUP ORPHANED PROFILES (Optional but recommended for "weird things")
-- Remove profiles that don't have a corresponding user in auth.users
-- Note: This requires permissions on auth.users which usually exists for postgres/service_role
-- We use a DO block to avoid errors if permissions are tight, but in migration runner it should work.
DO $$
BEGIN
    -- Delete users from public.users that don't exist in auth.users
    -- This fixes cases where a user was deleted from Auth but stuck in Public, blocking registration of same username/email
    DELETE FROM public.users
    WHERE id NOT IN (SELECT id FROM auth.users);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not cleanup orphaned users (permission issue likely): %', SQLERRM;
END $$;


-- 2. IMPROVE REGISTRATION TRIGGER
-- Re-create the trigger function with better error handling and search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
BEGIN
  -- Get metadata
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';

  -- Fallback for username if missing (e.g. OAuth)
  IF new_username IS NULL OR new_username = '' THEN
      new_username := split_part(new.email, '@', 1);
      -- Ensure uniqueness (simple append)
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := new_username || '_' || substring(md5(random()::text) from 1 for 4);
      END IF;
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
  VALUES (
      new.id, 
      new.email, 
      new_username, 
      new_avatar,
      'user',
      0
  )
  ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger is bound
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. ENSURE PERMISSIONS
-- Grant necessary permissions to allow the trigger and app to work
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure authenticated users can read all tables (RLS will filter, but basic permission needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;


-- 4. FIX RLS POLICIES FOR USERS (Redundant if previous migration ran, but safe to repeat)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read of profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT
    USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Explicitly allow service_role to do anything (bypass RLS)
-- Note: service_role bypasses RLS by default, but this is for clarity if using other roles
-- No policy needed for service_role usually.


-- 5. FIX CATEGORIES AND STORES (Ensure they are visible)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);

-- 6. FIX BADGES (If they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gamification_badges') THEN
        ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Anyone can view badges" ON gamification_badges;
        CREATE POLICY "Anyone can view badges" ON gamification_badges FOR SELECT USING (true);
    END IF;
END $$;


-- 
-- End of 20260309000002_fix_registration_and_cleanup.sql
-- 

-- 
-- Start of 20260309000003_fix_gamification_trigger.sql
-- 

-- Fix Gamification Trigger and Backfill
-- This ensures that user creation doesn't fail due to gamification errors

-- 1. Ensure Levels Exist (Idempotent seed)
INSERT INTO gamification_levels (level, xp_required, referral_limit, title) VALUES
(1, 0, 2, 'Novato'),
(2, 100, 2, 'Aprendiz'),
(3, 250, 2, 'Explorador'),
(4, 500, 2, 'Entusiasta'),
(5, 800, 2, 'Habitual'),
(6, 1200, 2, 'Veterano'),
(7, 1700, 2, 'Experto'),
(8, 2300, 2, 'Maestro'),
(9, 3000, 2, 'Leyenda'),
(10, 4000, 5, 'Mítico')
ON CONFLICT (level) DO NOTHING;

-- 2. Improve Gamification Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger AS $$
DECLARE
    v_next_xp INTEGER;
BEGIN
  -- Get next level XP safely
  SELECT xp_required INTO v_next_xp FROM gamification_levels WHERE level = 2;
  IF v_next_xp IS NULL THEN
      v_next_xp := 100; -- Fallback default
  END IF;

  INSERT INTO public.gamification_profiles (user_id, referral_code, next_level_xp)
  VALUES (
      new.id, 
      upper(substring(md5(random()::text) from 1 for 8)),
      v_next_xp
  )
  ON CONFLICT (user_id) DO NOTHING; -- Avoid error if already exists

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Backfill missing gamification profiles for existing users
DO $$
DECLARE
    r RECORD;
    v_next_xp INTEGER;
BEGIN
    SELECT xp_required INTO v_next_xp FROM gamification_levels WHERE level = 2;
    IF v_next_xp IS NULL THEN v_next_xp := 100; END IF;

    FOR r IN SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM gamification_profiles) LOOP
        INSERT INTO gamification_profiles (user_id, referral_code, next_level_xp)
        VALUES (
            r.id, 
            upper(substring(md5(random()::text) from 1 for 8)),
            v_next_xp
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;


-- 
-- End of 20260309000003_fix_gamification_trigger.sql
-- 

-- 
-- Start of 20260309_add_coupon_fields.sql
-- 

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS restrictions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT NULL;


-- 
-- End of 20260309_add_coupon_fields.sql
-- 

-- 
-- Start of 20260310000001_google_auth_improvements.sql
-- 

-- Improve Google Auth handling by setting verified role for confirmed users
-- This ensures Google users skip verification steps logically in the app

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
BEGIN
  -- Get metadata
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- Determine role based on email confirmation
  -- OAuth users have email_confirmed_at set on creation
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- Fallback for username if missing (e.g. OAuth)
  IF new_username IS NULL OR new_username = '' THEN
      new_username := split_part(new.email, '@', 1);
      -- Ensure uniqueness (simple append)
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := new_username || '_' || substring(md5(random()::text) from 1 for 4);
      END IF;
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
  VALUES (
      new.id, 
      new.email, 
      new_username, 
      new_avatar,
      initial_role,
      0
  )
  ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      -- Update role if user becomes verified (e.g. email confirmation later)
      -- But we only want to upgrade, not downgrade
      role = CASE 
        WHEN public.users.role = 'user' AND EXCLUDED.role = 'verified' THEN 'verified'
        ELSE public.users.role
      END,
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 
-- End of 20260310000001_google_auth_improvements.sql
-- 

-- 
-- Start of 20260310000002_fix_auth_trigger_v2.sql
-- 

-- Fix auth trigger with robust error handling and constraints
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
  base_username TEXT;
BEGIN
  -- 1. Get metadata safely
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- 2. Determine Role
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- 3. Generate Username if missing
  IF new_username IS NULL OR new_username = '' THEN
      -- Use email part or fallback to 'user'
      base_username := COALESCE(split_part(new.email, '@', 1), 'user');
      -- Clean up username (keep only alphanumeric)
      base_username := regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g');
      
      -- Fallback if empty after cleanup
      IF base_username = '' THEN
        base_username := 'user';
      END IF;

      -- Truncate to 40 chars to leave room for suffix
      base_username := substring(base_username from 1 for 40);
      new_username := base_username;
      
      -- Ensure uniqueness
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := base_username || '_' || substring(md5(random()::text) from 1 for 4);
      END IF;
      
      -- Double check uniqueness, if still fails, use random UUID segment
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := base_username || '_' || substring(md5(new.id::text) from 1 for 6);
      END IF;
  END IF;

  -- 4. Final safety truncation
  new_username := substring(new_username from 1 for 50);

  -- 5. Insert/Update
  INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
  VALUES (
      new.id, 
      new.email, 
      new_username, 
      new_avatar,
      initial_role,
      0
  )
  ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      role = CASE 
        WHEN public.users.role = 'user' AND EXCLUDED.role = 'verified' THEN 'verified'
        ELSE public.users.role
      END,
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant permissions just in case
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;


-- 
-- End of 20260310000002_fix_auth_trigger_v2.sql
-- 

-- 
-- Start of 20260310000003_fix_auth_trigger_robust.sql
-- 

-- 1. Clean up orphan users (users in public.users but not in auth.users)
-- This prevents "Email already exists" errors when re-registering after deleting from Auth
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Drop and recreate the trigger with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Safe metadata extraction
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- Determine Role
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- Generate Username
  -- Priority: 1. Metadata username, 2. Email prefix, 3. 'user'
  base_username := COALESCE(new_username, split_part(new.email, '@', 1), 'user');
  
  -- Sanitize: Allow only alphanumeric, underscores, and hyphens
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
  
  -- Ensure non-empty
  IF length(base_username) < 3 THEN
    base_username := 'user_' || substring(md5(random()::text) from 1 for 6);
  END IF;

  -- Truncate to avoid overflow (leaving space for suffix)
  base_username := substring(base_username from 1 for 30);
  final_username := base_username;

  -- Check for username collision and append suffix if needed
  IF EXISTS (SELECT 1 FROM public.users WHERE username = final_username) THEN
    final_username := base_username || '_' || substring(md5(new.id::text) from 1 for 4);
  END IF;
  
  -- Second check (just in case)
  IF EXISTS (SELECT 1 FROM public.users WHERE username = final_username) THEN
    final_username := base_username || '_' || floor(random() * 10000)::text;
  END IF;

  -- Insert with explicit error handling preference
  BEGIN
    INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
    VALUES (
        new.id, 
        new.email, 
        final_username, 
        new_avatar,
        initial_role,
        0
    );
  EXCEPTION WHEN unique_violation THEN
    -- If email exists (orphan that wasn't cleaned), we can't do much but fail.
    -- But we can try to insert with a random email to at least allow login? 
    -- No, that corrupts data. 
    -- If unique_violation is on username, our logic above should have caught it, 
    -- but race conditions exist.
    
    -- Retry with a definitely unique username
    INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
    VALUES (
        new.id, 
        new.email, 
        'u_' || substring(md5(new.id::text) from 1 for 10), 
        new_avatar,
        initial_role,
        0
    );
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 
-- End of 20260310000003_fix_auth_trigger_robust.sql
-- 

-- 
-- Start of manual_security_fix.sql
-- 

-- FIX SQL FOR MANUAL EXECUTION
-- Copy this content and run it in the Supabase Dashboard SQL Editor

-- 1. PREVENT ROLE CHANGES
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() = NEW.id THEN
       IF NEW.role != OLD.role THEN
           RAISE EXCEPTION 'You cannot change your own role.';
       END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_change();


-- 2. ENFORCE DEAL STATUS
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
         NEW.status := 'pending';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;
CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();


-- 
-- End of manual_security_fix.sql
-- 

