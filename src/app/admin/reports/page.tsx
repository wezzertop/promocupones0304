import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
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

  if (!['admin', 'moderator'].includes(role)) {
    redirect('/admin')
  }

  // Fetch reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <ReportsClient 
      initialReports={(reports as any) || []} 
    />
  )
}