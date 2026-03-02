import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch all badges
  const { data: badges, error: badgesError } = await supabase
    .from('gamification_badges')
    .select('*')
    .order('xp_reward', { ascending: true })
    
  if (badgesError) {
    return NextResponse.json({ error: badgesError.message }, { status: 500 })
  }
  
  // Fetch user earned badges
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('gamification_user_badges')
    .select('*')
    .eq('user_id', user.id)
    
  if (userBadgesError) {
    return NextResponse.json({ error: userBadgesError.message }, { status: 500 })
  }
  
  return NextResponse.json({ badges, user_badges: userBadges })
}
