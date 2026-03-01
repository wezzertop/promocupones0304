'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendNotification(targetUser: string, title: string, message: string) {
  const supabase = await createClient()
  
  // Verify admin
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

  // Find target user
  const { data: target, error: userError } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${targetUser},email.eq.${targetUser},username.eq.${targetUser}`)
    .single()

  if (userError || !target) {
    throw new Error('Usuario no encontrado.')
  }

  // Insert notification
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: (target as any).id,
      type: 'system_alert',
      title,
      message,
      is_read: false
    })

  if (notifError) throw new Error(notifError.message)

  // Log action
  await supabase.from('moderation_logs').insert({
    action_type: 'send_notification',
    target_id: (target as any).id,
    target_type: 'user',
    details: { title, message }
  })
}