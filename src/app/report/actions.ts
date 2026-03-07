'use server'

import { createClient } from '@/lib/supabase/server'
import { reportSchema } from '@/lib/schemas'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function submitReport(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para reportar contenido' }
  }

  // 2. Extract & Validate Data
  const rawData = {
    target_id: formData.get('target_id'),
    target_type: formData.get('target_type'),
    reason: formData.get('reason'),
    description: formData.get('description'),
  }

  const validated = reportSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const data = validated.data

  // 3. Insert into DB
  const { error } = await (supabase.from('reports') as any)
    .insert({
      reporter_id: user.id,
      target_id: data.target_id,
      target_type: data.target_type,
      reason: data.reason,
      description: data.description || null,
      status: 'pending'
    })

  if (error) {
    console.error('Report error:', error)
    return { error: 'Error al enviar el reporte. Inténtalo de nuevo.' }
  }

  return { success: true, message: 'Reporte enviado correctamente. Gracias por ayudar a la comunidad.' }
}
