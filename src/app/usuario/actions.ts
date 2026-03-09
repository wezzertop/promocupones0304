'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function giveReputationAction(receiverId: string, amount: number) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Debes iniciar sesión para dar puntos' }
  }

  if (user.id === receiverId) {
    return { error: 'No puedes darte puntos a ti mismo' }
  }

  if (![1, 3, 5].includes(amount)) {
    return { error: 'Cantidad de puntos inválida' }
  }

  try {
    const { error } = await supabase.rpc('transfer_reputation_points', {
      p_sender_id: user.id,
      p_receiver_id: receiverId,
      p_amount: amount
    })

    if (error) {
      console.error('Error transfering points:', error)
      if (error.message.includes('Insufficient points')) {
        return { error: 'No tienes suficientes puntos para realizar esta acción' }
      }
      if (error.message.includes('Already transferred')) {
        return { error: 'Ya has dado puntos a este usuario anteriormente' }
      }
      return { error: 'Error al transferir puntos' }
    }

    revalidatePath(`/usuario/[username]`, 'page') // We will need to know the username to be precise, but simpler is to revalidate the path where this is used.
    // Ideally pass the path to revalidate or use a tag.
    
    return { success: true, message: `Has enviado ${amount} puntos exitosamente` }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { error: 'Ocurrió un error inesperado' }
  }
}
