
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, DollarSign, Tag, Type, Link as LinkIcon, Image as ImageIcon, FileText, Loader2, X, Calendar, MapPin, Percent, ShoppingBag, Truck, Globe, HelpCircle, Save } from 'lucide-react'
import { compressImage } from '@/lib/utils'
import Image from 'next/image'
import Map from '@/components/DynamicMap'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { updateDeal } from '../../actions'
import { use } from 'react'

interface Category {
  id: string
  name: string
}

const COUNTRIES = [
  "México", "Estados Unidos", "China", "España", "Internacional", "Otro"
]

export default function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [shippingCountry, setShippingCountry] = useState('México')
  const [availability, setAvailability] = useState('online')
  const [startDate, setStartDate] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  
  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  
  const MAX_TITLE = 100
  const MAX_DESC = 2000

  const [location, setLocation] = useState<[number, number] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // 1. Fetch Categories & Deal Data
  useEffect(() => {
    async function init() {
      // Categories
      const { data: cats } = await supabase.from('categories').select('id, name').order('name')
      if (cats) setCategories(cats as unknown as Category[])

      // Deal Data
      const { data: deal, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single() as { data: any, error: any }

      if (error || !deal) {
        console.error('Error fetching deal:', error)
        alert('Oferta no encontrada')
        router.push('/')
        return
      }

      // Check permissions (basic check, real check on server)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== deal.user_id) {
         // Ideally verify admin here too, but for now redirect if not owner
         alert('No tienes permiso para editar esta oferta')
         router.push(`/oferta/${id}`)
         return
      }

      // Populate Form
      setTitle(deal.title)
      setDescription(deal.description || '')
      setPrice(deal.deal_price)
      setOriginalPrice(deal.original_price || '')
      setUrl(deal.deal_url)
      setCategoryId(deal.category_id)
      setCouponCode(deal.coupon_code || '')
      setShippingCost(deal.shipping_cost || '')
      setShippingCountry(deal.shipping_country || 'México')
      setAvailability(deal.availability || 'online')
      
      if (deal.start_date) setStartDate(new Date(deal.start_date).toISOString().slice(0, 16))
      if (deal.expires_at) setExpiresAt(new Date(deal.expires_at).toISOString().slice(0, 16))
      
      if (deal.image_urls && Array.isArray(deal.image_urls)) {
        setExistingImages(deal.image_urls)
      }

      setLoading(false)
    }
    init()
  }, [id, supabase, router])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      try {
        const objectUrl = URL.createObjectURL(file)
        newPreviews.push(objectUrl)
        const compressedBlob = await compressImage(file)
        newFiles.push(new File([compressedBlob], file.name, { type: 'image/jpeg' }))
      } catch (error) {
        console.error('Error:', error)
      }
    }

    setImageFiles(prev => [...prev, ...newFiles])
    setPreviewUrls(prev => [...prev, ...newPreviews])
  }

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      return newPreviews.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Upload new images first
      const uploadedUrls: string[] = []
      for (const file of imageFiles) {
          const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('deals')
            .upload(fileName, file, { contentType: 'image/jpeg' })

          if (!uploadError) {
             const { data: { publicUrl } } = supabase.storage.from('deals').getPublicUrl(fileName)
             uploadedUrls.push(publicUrl)
          }
      }

      // Combine existing and new images
      const finalImages = [...existingImages, ...uploadedUrls]
      if (finalImages.length === 0) {
        alert('Debes tener al menos una imagen')
        setSaving(false)
        return
      }

      // Prepare FormData for Server Action
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('price', price.toString())
      if (originalPrice) formData.append('original_price', originalPrice.toString())
      formData.append('url', url)
      formData.append('category_id', categoryId)
      if (couponCode) formData.append('coupon_code', couponCode)
      if (availability) formData.append('availability', availability)
      if (shippingCost) formData.append('shipping_cost', shippingCost.toString())
      if (shippingCountry) formData.append('shipping_country', shippingCountry)
      if (startDate) formData.append('start_date', startDate)
      if (expiresAt) formData.append('expires_at', expiresAt)
      formData.append('image_urls', JSON.stringify(finalImages))

      // Call Server Action
      const result = await updateDeal(id, null, formData)

      if (result.error) {
        if (typeof result.error === 'string') {
          alert(result.error)
        } else {
          // Zod errors
          const msg = Object.values(result.error).flat().join('\n')
          alert(`Errores de validación:\n${msg}`)
        }
      } else {
        alert('¡Oferta actualizada correctamente!')
        router.push(`/oferta/${id}`)
        router.refresh()
      }

    } catch (error: any) {
      console.error('Error:', error)
      alert('Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2BD45A]" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Editar Oferta</h1>
          <p className="text-zinc-400">Actualiza la información de tu publicación</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Título */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Título</label>
              <div className="relative">
                <Type className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  maxLength={MAX_TITLE}
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-16 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">
                  {title.length}/{MAX_TITLE}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                Sugerido: Título | Marca | Modelo | Versión
              </p>
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Precio Oferta</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-[#2BD45A]" />
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                    step="0.01"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Precio Original</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    step="0.01"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* URL y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none"
                  />
                </div>
               </div>
               <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Categoría</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none appearance-none"
                  >
                    <option value="" className="bg-zinc-900">Seleccionar...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                    ))}
                  </select>
                </div>
               </div>
            </div>

             {/* Cupón */}
             <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Cupón (Opcional)</label>
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Código de descuento"
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none uppercase"
                />
             </div>

            {/* Imágenes */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Imágenes</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <img src={url} alt="Deal" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button type="button" onClick={() => removeExistingImage(idx)} className="p-2 bg-red-500/20 text-red-400 rounded-full">
                         <X className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
                {/* New Previews */}
                {previewUrls.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-green-500/30 group">
                    <img src={url} alt="New" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button type="button" onClick={() => removeNewImage(idx)} className="p-2 bg-red-500/20 text-red-400 rounded-full">
                         <X className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
                
                <label className="aspect-square bg-black/20 border border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#2BD45A]/50 transition-colors">
                  <ImageIcon className="h-6 w-6 text-zinc-500" />
                  <span className="text-xs text-zinc-500 mt-2">Agregar</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Descripción</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={5}
                  maxLength={MAX_DESC}
                  className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 pb-8 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none resize-none"
                />
                <div className="absolute bottom-2 right-3 text-xs text-zinc-500 font-medium bg-black/40 px-2 py-0.5 rounded">
                  {description.length}/{MAX_DESC}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>

          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}
