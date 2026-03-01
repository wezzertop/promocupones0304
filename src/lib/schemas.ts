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

export type DealSchema = z.infer<typeof dealSchema>
