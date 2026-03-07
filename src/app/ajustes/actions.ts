'use server'

import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  // 2. Extract Data
  const rawData = {
    username: formData.get('username'),
    avatar_url: formData.get('avatar_url') || null,
  }

  // 3. Validate with Zod
  const validatedFields = profileSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const data = validatedFields.data

  // 4. Check Username Uniqueness (if changed)
  // We need to check if the username is already taken by someone else
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', data.username)
    .single()

  if (existingUser && (existingUser as any).id !== user.id) {
    return { error: { username: ['El nombre de usuario ya está en uso'] } }
  }

  // 5. Update Profile
  const { error: updateError } = await (supabase.from('users') as any)
    .update({
      username: data.username,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Error al actualizar el perfil' }
  }

  revalidatePath('/ajustes')
  revalidatePath('/perfil')
  revalidatePath('/') // To update avatar in header/posts

  return { success: true, message: 'Perfil actualizado correctamente' }
}
