'use server'

import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/schemas'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function submitContactForm(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Get User (Optional)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Extract & Validate Data
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  }

  const validated = contactSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const data = validated.data

  // 3. Insert into DB
  const { error } = await supabase
    .from('contact_messages')
    .insert({
      user_id: user?.id || null,
      name: data.name,
      email: data.email,
      message: data.message,
    })

  if (error) {
    console.error('Contact form error:', error)
    return { error: 'Error al enviar el mensaje. Inténtalo de nuevo más tarde.' }
  }

  return { success: true, message: '¡Mensaje enviado! Te responderemos pronto.' }
}
