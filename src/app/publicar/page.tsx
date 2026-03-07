
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, DollarSign, Tag, Type, Link as LinkIcon, Image as ImageIcon, FileText, Loader2, X, Calendar, MapPin, Percent, ShoppingBag, Truck, Globe, HelpCircle, Check, ChevronsUpDown, Store as StoreIcon, GripVertical } from 'lucide-react'
import { compressImage, analyzeImage, slugify, cn } from '@/lib/utils'
import Image from 'next/image'
import Map from '@/components/DynamicMap'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isReferralUrl, canUserPostReferral, checkForbiddenWords } from '@/lib/moderation'
import PublicationSuccessModal from '@/components/PublicationSuccessModal'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem'

interface Category {
  id: string
  name: string
}

interface Store {
  id: string
  name: string
  slug: string
}


const COUNTRIES = [
  "México", "Estados Unidos", "China", "España", "Internacional", "Otro"
]

export default function CreateDealPage() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [storeSearch, setStoreSearch] = useState('')
  const [isStoreOpen, setIsStoreOpen] = useState(false)
  const [customStoreName, setCustomStoreName] = useState('')
  // Unified state for dnd
  interface ImageItem {
    id: string
    url: string
    file?: File
  }
  const [items, setItems] = useState<ImageItem[]>([])
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [titleLength, setTitleLength] = useState(0)
  const [descLength, setDescLength] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const MAX_TITLE = 100
  const MAX_DESC = 2000
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

  useEffect(() => {
    async function fetchData() {
      const [categoriesRes, storesRes] = await Promise.all([
        (supabase.from('categories') as any).select('id, name').order('name'),
        (supabase.from('stores') as any).select('id, name, slug').order('name')
      ])
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data as unknown as Category[])
      }
      
      if (storesRes.data) {
        setStores(storesRes.data as unknown as Store[])
      }
    }
    fetchData()
  }, [supabase])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validar límite de 6 imágenes
    if (items.length + files.length > 6) {
      alert('Solo puedes subir un máximo de 6 imágenes por oferta.')
      return
    }

    // Validar y procesar cada archivo
    const newItems: ImageItem[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue
      }

      try {
        // 1. Analizar imagen (Calidad, Aspect Ratio, Resolución)
        const analysis = await analyzeImage(file)
        if (!analysis.valid) {
          alert(`La imagen ${file.name} no cumple los requisitos: ${analysis.reason}`)
          continue
        }

        const objectUrl = URL.createObjectURL(file)
        
        // 2. Optimizar imagen (Compresión + WebP + Resize)
        const compressedBlob = await compressImage(file)
        const newFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })
        
        newItems.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: objectUrl,
          file: newFile
        })
      } catch (error) {
        console.error('Error procesando imagen:', error)
      }
    }

    setItems(prev => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const itemToRemove = prev.find(item => item.id === id)
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.url) // Limpiar memoria
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // Capturar datos del formulario antes de operaciones asíncronas
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title')
    const description = formData.get('description')
    const price = formData.get('price')
    const original_price = formData.get('original_price')
    const url = formData.get('url')
    const categoryId = formData.get('category')
    const expires_at = formData.get('expires_at')
    const start_date = formData.get('start_date')
    const coupon_code = formData.get('coupon_code')
    const availability = formData.get('availability')
    const shipping_cost = formData.get('shipping_cost')
    const shipping_country = formData.get('shipping_country')

    try {
      // Verificar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Debes iniciar sesión para publicar una oferta')
        router.push('/login')
        return
      }

      // Validaciones básicas
      if (!title || !price || !url || !categoryId) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // 1. Resolver Store ID
      let finalStoreId = null

      if (selectedStore) {
        finalStoreId = selectedStore.id
      } else if (customStoreName.trim()) {
        const slug = slugify(customStoreName)
        
        // Intentar crear la tienda
        // Primero verificamos si ya existe por slug para evitar errores
        const { data: existingStore } = await (supabase.from('stores') as any)
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (existingStore) {
          finalStoreId = (existingStore as any).id
        } else {
          const { data: newStore, error: createStoreError } = await (supabase.from('stores') as any)
            .insert({
              name: customStoreName.trim(),
              slug: slug,
              is_verified: false
            })
            .select('id')
            .single()

          if (createStoreError) {
            console.error('Error creando tienda:', createStoreError)
            // Si falla, podríamos ignorarlo o mostrar error. 
            // Para robustez, seguimos sin store_id o lanzamos error.
          } else if (newStore) {
            finalStoreId = (newStore as any).id
          }
        }
      }

      // MODERATION CHECK: Forbidden Words
      const titleCheck = await checkForbiddenWords(title.toString())
      if (titleCheck.hasForbidden) {
        throw new Error(`El título contiene palabras prohibidas: ${titleCheck.word}`)
      }
      
      const descCheck = await checkForbiddenWords(description?.toString() || '')
      if (descCheck.hasForbidden) {
         throw new Error(`La descripción contiene palabras prohibidas: ${descCheck.word}`)
      }

      // MODERATION CHECK: Referral Links
      const { isReferral, reason } = await isReferralUrl(url.toString())
      if (isReferral) {
        // Check if user is allowed to post referrals
        const { canPost, limit, used } = await canUserPostReferral(session.user.id)
        if (!canPost) {
           if (limit === 0) {
             throw new Error(`No tienes nivel suficiente para publicar enlaces de referidos (mínimo nivel 10). ${reason}`)
           } else {
             throw new Error(`Has alcanzado tu límite semanal de enlaces de referidos (${used}/${limit}). Intenta la próxima semana.`)
           }
        }
      }

      const uploadedImageUrls: string[] = []

      // Subir imágenes
      if (items.length > 0) {
        for (const item of items) {
          if (!item.file) continue
          
          const file = item.file
          const fileExt = 'webp'
          const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('deals')
            .upload(fileName, file, {
              contentType: 'image/webp',
              upsert: false
            })

          if (uploadError) {
            console.error('Error subiendo imagen:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('deals')
            .getPublicUrl(fileName)
            
          uploadedImageUrls.push(publicUrl)
        }
      } else {
        throw new Error('Debes subir al menos una imagen')
      }

      // Calcular porcentaje de descuento si hay precio original
      let discount_percentage = null
      if (original_price && Number(original_price) > Number(price)) {
        discount_percentage = Math.round(((Number(original_price) - Number(price)) / Number(original_price)) * 100)
      }

      // Get User Role to determine status
      const { data: userProfile } = await (supabase.from('users') as any)
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      // 2. Determinar estado inicial
      // Por defecto PENDING. El backend también forzará esto via trigger, pero aquí lo mostramos para la UI
      const userRole = (userProfile as any)?.role || 'user'
      const initialStatus = ['admin', 'moderator'].includes(userRole) ? 'active' : 'pending'

      console.log('User Role:', userRole, 'Initial Status:', initialStatus) // Debug

      // Preparar payload
      const deal = {
        user_id: session.user.id,
        category_id: categoryId,
        store_id: finalStoreId,
        title,
        description,
        deal_price: Number(price),
        original_price: original_price ? Number(original_price) : null,
        discount_percentage,
        deal_url: url,
        image_urls: uploadedImageUrls,
        deal_type: coupon_code ? 'coupon' : 'deal',
        status: initialStatus,
        expires_at: expires_at ? new Date(expires_at as string).toISOString() : null,
        // New fields
        coupon_code: coupon_code || null,
        availability: availability || null,
        shipping_cost: shipping_cost ? Number(shipping_cost) : 0,
        shipping_country: shipping_country || null,
        start_date: start_date ? new Date(start_date as string).toISOString() : null,
        is_referral: isReferral
      }
      
      const { error } = await (supabase.from('deals') as any).insert(deal)

      if (error) {
        throw new Error(`Error al guardar la oferta: ${error.message}`)
      }

      // Mostrar modal en lugar de alerta y redirección inmediata
      setShowSuccessModal(true)

    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    router.push('/')
    router.refresh()
  }

  return (
    <TooltipProvider>
      <PublicationSuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleCloseModal} 
      />
      <div className="max-w-2xl mx-auto pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Publicar Oferta</h1>
          <p className="text-zinc-400">Comparte una nueva oferta con la comunidad</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              
              {/* Titulo */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Título de la oferta
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Escribe un título claro y descriptivo del producto o servicio.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    name="title"
                    required
                    type="text"
                    maxLength={MAX_TITLE}
                    onChange={(e) => setTitleLength(e.target.value.length)}
                    placeholder="Ej: MacBook Air M2 15 pulgadas"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">
                    {titleLength}/{MAX_TITLE}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                  Sugerido: Título | Marca | Modelo | Versión
                </p>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Precio Oferta
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>El precio final con el descuento aplicado.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-[#2BD45A]" />
                  </div>
                  <input
                    name="price"
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                  />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Precio Original
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>El precio regular sin descuento. Calcularemos el % de ahorro automáticamente.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    name="original_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                  />
                  </div>
                </div>
              </div>

              {/* Cupón y URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Cupón (Opcional)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Código necesario para obtener el descuento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="coupon_code"
                      type="text"
                      placeholder="Ej: AHORRO20"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600 uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    URL de la oferta
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enlace directo al producto o servicio.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      name="url"
                      required
                      type="url"
                      placeholder="https://tienda.com/producto"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* Disponibilidad y Envío */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Disponibilidad
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>¿Dónde se puede comprar esta oferta?</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShoppingBag className="h-4 w-4 text-zinc-500" />
                    </div>
                    <select
                      name="availability"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="online" className="bg-zinc-900">Online</option>
                      <option value="in_store" className="bg-zinc-900">Tienda Física</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Costo de Envío
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Deja en 0 si el envío es gratis.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Truck className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      name="shipping_cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* País y Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Enviado desde
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>País de origen del envío.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-zinc-500" />
                    </div>
                    <select
                      name="shipping_country"
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all appearance-none cursor-pointer"
                    >
                      {COUNTRIES.map(country => (
                        <option key={country} value={country} className="bg-zinc-900">{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Empieza
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fecha de inicio de la oferta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <input
                    name="start_date"
                    type="datetime-local"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Termina
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fecha de expiración de la oferta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <input
                    name="expires_at"
                    type="datetime-local"
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Imágenes Múltiples */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Imágenes de la oferta
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Puedes subir hasta 6 imágenes. La primera será la principal.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  
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
                        
                        <label 
                          htmlFor="image-upload"
                          className="w-full aspect-square bg-black/20 border border-white/10 text-zinc-400 hover:text-white hover:border-[#2BD45A]/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group gap-2"
                        >
                          <div className="p-3 rounded-full bg-zinc-800/50 group-hover:bg-[#2BD45A]/20 transition-colors">
                            <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-[#2BD45A]" />
                          </div>
                          <span className="text-xs text-zinc-500 group-hover:text-zinc-300 text-center px-2">Agregar imágenes</span>
                        </label>
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Categoría
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selecciona la categoría que mejor describa tu oferta.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-zinc-500" />
                  </div>
                  <select
                    name="category"
                    required
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-zinc-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tienda */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Tienda
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selecciona la tienda o escribe el nombre si no aparece.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <StoreIcon className="h-5 w-5 text-zinc-500" />
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedStore ? selectedStore.name : storeSearch}
                      onChange={(e) => {
                        setStoreSearch(e.target.value)
                        setSelectedStore(null)
                        setCustomStoreName(e.target.value)
                        setIsStoreOpen(true)
                      }}
                      onFocus={() => setIsStoreOpen(true)}
                      onBlur={() => {
                        // Delay closing to allow clicking on options
                        setTimeout(() => setIsStoreOpen(false), 200)
                      }}
                      placeholder="Buscar o agregar tienda..."
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                    />
                    
                    {selectedStore && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStore(null)
                          setStoreSearch('')
                          setCustomStoreName('')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {!selectedStore && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronsUpDown className="h-4 w-4 text-zinc-500" />
                      </div>
                    )}

                    {/* Dropdown */}
                    {isStoreOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-auto">
                        {stores
                          .filter(store => store.name.toLowerCase().includes(storeSearch.toLowerCase()))
                          .map(store => (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => {
                                setSelectedStore(store)
                                setStoreSearch(store.name)
                                setCustomStoreName('')
                                setIsStoreOpen(false)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-white/5 text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                            >
                              <span>{store.name}</span>
                              {selectedStore?.id === store.id && <Check className="h-4 w-4 text-[#2BD45A]" />}
                            </button>
                          ))}
                        
                        {storeSearch && !stores.some(s => s.name.toLowerCase() === storeSearch.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              // We will handle creation on submit
                              setCustomStoreName(storeSearch)
                              setSelectedStore(null)
                              setIsStoreOpen(false)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-[#2BD45A] font-medium transition-colors"
                          >
                            Usar "{storeSearch}" como nueva tienda
                          </button>
                        )}
                        
                        {stores.length === 0 && !storeSearch && (
                          <div className="px-4 py-2 text-zinc-500 text-sm">Cargando tiendas...</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Ubicación de la oferta (Opcional)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Si es una oferta física, marca la ubicación en el mapa.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>Haz clic en el mapa para seleccionar la ubicación</span>
                  </div>
                  <Map position={location} setPosition={setLocation} />
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar ubicación seleccionada
                    </button>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Descripción
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-[#2BD45A] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Detalla características, condiciones y por qué es una buena oferta.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-zinc-500" />
                  </div>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    maxLength={MAX_DESC}
                    onChange={(e) => setDescLength(e.target.value.length)}
                    placeholder="Describe los detalles de la oferta..."
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 pb-8 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600 resize-none"
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-zinc-500 font-medium bg-black/40 px-2 py-0.5 rounded">
                    {descLength}/{MAX_DESC}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-4 rounded-xl shadow-lg shadow-[#2BD45A]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publicar Oferta
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}
