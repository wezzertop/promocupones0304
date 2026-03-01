import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogsClient from './LogsClient'

export default async function LogsPage() {
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

  // Fetch logs
  const { data: logs } = await supabase
    .from('moderation_logs')
    .select('*, admin:users!admin_id(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <LogsClient 
      initialLogs={(logs as any) || []} 
    />
  )
}