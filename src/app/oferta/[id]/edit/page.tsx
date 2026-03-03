
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, DollarSign, Tag, Type, Link as LinkIcon, Image as ImageIcon, FileText, Loader2, X, Calendar, MapPin, Percent, ShoppingBag, Truck, Globe, HelpCircle, Save, GripVertical } from 'lucide-react'
import { compressImage, analyzeImage } from '@/lib/utils'
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem'

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
  // Unified state for dnd: { id: string, type: 'existing' | 'new', url: string, file?: File }
  interface ImageItem {
    id: string
    type: 'existing' | 'new'
    url: string
    file?: File
  }
  const [items, setItems] = useState<ImageItem[]>([])
  
  const MAX_TITLE = 100
  const MAX_DESC = 2000

  const [location, setLocation] = useState<[number, number] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        const initialItems = deal.image_urls.map((url: string, index: number) => ({
          id: `existing-${index}`,
          type: 'existing' as const,
          url
        }))
        setItems(initialItems)
      }

      setLoading(false)
    }
    init()
  }, [id, supabase, router])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newItems: ImageItem[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      try {
        const analysis = await analyzeImage(file)
        if (!analysis.valid) {
          alert(`La imagen ${file.name} no cumple los requisitos: ${analysis.reason}`)
          continue
        }

        const objectUrl = URL.createObjectURL(file)
        const compressedBlob = await compressImage(file)
        const newFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })
        
        newItems.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'new',
          url: objectUrl,
          file: newFile
        })
      } catch (error) {
        console.error('Error:', error)
      }
    }

    setItems(prev => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const itemToRemove = prev.find(item => item.id === id)
      if (itemToRemove?.type === 'new') {
        URL.revokeObjectURL(itemToRemove.url)
      }
      return prev.filter(item => item.id !== id)
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Upload new images
      const finalImages: string[] = []
      
      for (const item of items) {
        if (item.type === 'existing') {
          finalImages.push(item.url)
        } else if (item.type === 'new' && item.file) {
          const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
          const { error: uploadError } = await supabase.storage
            .from('deals')
            .upload(fileName, item.file, { contentType: 'image/webp' })

          if (!uploadError) {
             const { data: { publicUrl } } = supabase.storage.from('deals').getPublicUrl(fileName)
             finalImages.push(publicUrl)
          }
        }
      }

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

            {/* Cupón y Disponibilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Cupón (Opcional)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Código de descuento"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none uppercase"
                    />
                  </div>
               </div>
               <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Disponibilidad</label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                    <select
                      value={availability}
                      onChange={e => setAvailability(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none appearance-none"
                    >
                      <option value="online" className="bg-zinc-900">Online</option>
                      <option value="in_store" className="bg-zinc-900">Tienda Física</option>
                    </select>
                  </div>
               </div>
            </div>

            {/* Envío y País */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Costo de Envío</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={e => setShippingCost(e.target.value)}
                    placeholder="0 para gratis"
                    step="0.01"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">País de Envío</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <select
                    value={shippingCountry}
                    onChange={e => setShippingCountry(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none appearance-none"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c} className="bg-zinc-900">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Fecha de Inicio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Fecha de Expiración</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#2BD45A]/50 outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Imágenes (Arrastra para ordenar)</label>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={items.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {items.map((item, index) => (
                      <SortableItem 
                        key={item.id} 
                        id={item.id} 
                        url={item.url} 
                        index={index}
                        onRemove={removeItem} 
                      />
                    ))}
                    
                    <label className="aspect-square bg-black/20 border border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#2BD45A]/50 transition-colors">
                      <ImageIcon className="h-6 w-6 text-zinc-500" />
                      <span className="text-xs text-zinc-500 mt-2">Agregar</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </SortableContext>
              </DndContext>
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
