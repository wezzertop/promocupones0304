'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function banUser(userId: string, reason: string) {
  const supabase = await createClient()
  
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((currentUser as any)?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  // Perform ban
  const { error } = await supabase
    .from('users')
    .update({ 
      is_banned: true,
      ban_reason: reason,
      banned_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  // Log action
  await supabase.from('moderation_logs').insert({
    action_type: 'ban_user',
    target_id: userId,
    target_type: 'user',
    details: { reason }
  })

  revalidatePath('/admin/users')
}

export async function unbanUser(userId: string) {
  const supabase = await createClient()
  
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((currentUser as any)?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  // Perform unban
  const { error } = await supabase
    .from('users')
    .update({ 
      is_banned: false,
      ban_reason: null,
      banned_at: null
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  // Log action
  await supabase.from('moderation_logs').insert({
    action_type: 'unban_user',
    target_id: userId,
    target_type: 'user'
  })

  revalidatePath('/admin/users')
}