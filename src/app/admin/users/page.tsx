import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UsersPage({ searchParams }: PageProps) {
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
    // Redirect to admin dashboard if not admin (e.g. moderator)
    redirect('/admin')
  }

  // Fetch users
  const resolvedSearchParams = await searchParams
  const searchTerm = resolvedSearchParams.q as string | undefined
  
  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  
  if (searchTerm) {
    query = query.ilike('username', `%${searchTerm}%`)
  }

  const { data: users } = await query

  return (
    <UsersClient 
      initialUsers={(users as any) || []} 
      currentUserRole={role}
      searchQuery={searchTerm}
    />
  )
}