import { z } from 'zod'

export const dealSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  original_price: z.number().min(0, 'El precio original no puede ser negativo').nullable().optional(),
  url: z.string().url('Debe ser una URL válida'),
  category_id: z.string().uuid('Categoría inválida'),
  coupon_code: z.string().optional().nullable(),
  availability: z.enum(['online', 'in_store']).optional().nullable(),
  shipping_cost: z.number().min(0).default(0),
  shipping_country: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  image_urls: z.array(z.string().url()).min(1, 'Debes subir al menos una imagen')
})

export const profileSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(20, 'El nombre de usuario no puede exceder 20 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  avatar_url: z.string().nullable().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
})

export const reportSchema = z.object({
  target_id: z.string().uuid(),
  target_type: z.enum(['deal', 'comment']),
  reason: z.string().min(1, 'Debes seleccionar un motivo'),
  description: z.string().optional(),
})

export type DealSchema = z.infer<typeof dealSchema>
export type ProfileSchema = z.infer<typeof profileSchema>
export type ContactSchema = z.infer<typeof contactSchema>
export type ReportSchema = z.infer<typeof reportSchema>
