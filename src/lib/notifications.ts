import { createClient } from '@/lib/supabase/client'

export async function createNotification(
  userId: string, 
  type: 'post_approved' | 'post_rejected' | 'system_alert', 
  title: string, 
  message: string,
  link?: string
) {
  const supabase = createClient()
  
  const { error } = await (supabase.from('notifications') as any)
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      is_read: false
    })

  if (error) {
    console.error('Error creating notification:', error)
  }
}
