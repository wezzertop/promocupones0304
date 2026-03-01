import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (userData as any)?.role || 'user'

  if (role !== 'admin') {
    redirect('/admin')
  }

  // Fetch data
  const { data: patterns } = await supabase
    .from('referral_patterns')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: forbiddenWords } = await supabase
    .from('forbidden_words')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <SettingsClient 
      initialPatterns={(patterns as any) || []}
      initialForbiddenWords={(forbiddenWords as any) || []}
    />
  )
}