'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdminOrMod() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'moderator'].includes((data as any)?.role)) {
    throw new Error('Forbidden')
  }
  return { supabase, user, role: (data as any)?.role }
}

export async function resolveReport(id: string, status: 'resolved' | 'dismissed') {
  const { supabase } = await checkAdminOrMod()
  
  const { error } = await (supabase.from('reports') as any)
    .update({ 
      status,
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await (supabase.from('moderation_logs') as any).insert({
    action_type: status === 'resolved' ? 'resolve_report' : 'dismiss_report',
    target_id: id,
    target_type: 'report'
  })

  revalidatePath('/admin/reports')
}

export async function deleteContent(reportId: string, targetId: string, targetType: 'deal' | 'comment') {
  const { supabase } = await checkAdminOrMod()

  let error = null
  
  if (targetType === 'deal') {
    const { error: e } = await (supabase.from('deals') as any).delete().eq('id', targetId)
    error = e
  } else {
    const { error: e } = await (supabase.from('comments') as any).delete().eq('id', targetId)
    error = e
  }

  if (error) throw new Error(error.message)

  await (supabase.from('moderation_logs') as any).insert({
    action_type: 'delete_content',
    target_id: targetId,
    target_type: targetType,
    details: { reason: 'Reported content deleted' }
  })
  
  // Auto resolve
  await resolveReport(reportId, 'resolved')
}

export async function banAuthor(reportId: string, targetId: string, targetType: 'deal' | 'comment', reason: string) {
  const { supabase } = await checkAdminOrMod()

  // 1. Find author ID
  let userId = null
  
  if (targetType === 'deal') {
    const { data } = await (supabase.from('deals') as any).select('user_id').eq('id', targetId).single()
    userId = (data as any)?.user_id
  } else {
     const { data } = await (supabase.from('comments') as any).select('user_id').eq('id', targetId).single()
     userId = (data as any)?.user_id
  }

  if (!userId) {
    throw new Error('No se pudo encontrar el autor del contenido.')
  }

  // 2. Check if author is admin/mod
  const { data: user } = await (supabase.from('users') as any).select('role').eq('id', userId).single()
  if ((user as any)?.role === 'admin' || (user as any)?.role === 'moderator') {
    throw new Error('No puedes banear a un miembro del staff.')
  }

  // 3. Ban user
  const { error } = await (supabase.from('users') as any)
    .update({ 
      is_banned: true, 
      ban_reason: `Baneado por reporte: ${reason}`,
      banned_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await (supabase.from('moderation_logs') as any).insert({
    action_type: 'ban_user',
    target_id: userId,
    target_type: 'user',
    details: { reason: `Reported in ${reportId}` }
  })

  // Auto resolve
  await resolveReport(reportId, 'resolved')
}