
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, HelpCircle, AlertCircle, ShoppingBag, User, Shield, MessageSquare, ChevronRight } from 'lucide-react'

const FAQ_CATEGORIES = [
  {
    id: 'general',
    title: 'General',
    icon: HelpCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'posting',
    title: 'Publicar Ofertas',
    icon: ShoppingBag,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: 'account',
    title: 'Cuenta y Perfil',
    icon: User,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'moderation',
    title: 'Moderación',
    icon: Shield,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
]

const FAQ_ITEMS = [
  {
    id: 'how-to-post',
    category: 'posting',
    question: '¿Cómo publico una oferta?',
    answer: 'Para publicar una oferta, haz clic en el botón "Publicar Oferta" en la parte superior derecha de la página. Rellena el formulario con los detalles del producto, incluyendo el precio, el enlace y una descripción. Asegúrate de verificar que la oferta sea válida antes de compartirla.',
  },
  {
    id: 'what-is-karma',
    category: 'general',
    question: '¿Qué es el Karma?',
    answer: 'El Karma es un sistema de reputación que recompensa a los usuarios por contribuir con contenido de calidad. Ganas Karma cuando otros usuarios votan positivamente tus publicaciones o comentarios. Un Karma alto puede desbloquear funciones especiales y medallas.',
  },
  {
    id: 'edit-profile',
    category: 'account',
    question: '¿Cómo edito mi perfil?',
    answer: 'Ve a tu perfil haciendo clic en tu avatar en la esquina superior derecha y selecciona "Mi Perfil". Allí encontrarás un botón de "Editar Perfil" o un icono de engranaje que te permitirá cambiar tu nombre de usuario, foto y preferencias.',
  },
  {
    id: 'report-content',
    category: 'moderation',
    question: '¿Cómo reporto contenido inapropiado?',
    answer: 'Si encuentras una oferta falsa, spam o comentarios ofensivos, utiliza el botón de "Reportar" (icono de bandera) que aparece en cada publicación o comentario. Nuestro equipo de moderación revisará el reporte lo antes posible.',
  },
  {
    id: 'delete-account',
    category: 'account',
    question: '¿Cómo elimino mi cuenta?',
    answer: 'Si deseas eliminar tu cuenta permanentemente, por favor contacta a nuestro equipo de soporte a través del formulario de contacto. Procesaremos tu solicitud en un plazo de 48 horas.',
  },
  {
    id: 'expired-deals',
    category: 'posting',
    question: '¿Qué hago si una oferta ha expirado?',
    answer: 'Si encuentras una oferta que ya no está disponible, puedes marcarla como "Expirada" utilizando el botón correspondiente en la página de la oferta. Esto ayuda a mantener la comunidad actualizada.',
  },
  {
    id: 'contact-support',
    category: 'general',
    question: '¿Cómo contacto al soporte?',
    answer: 'Puedes contactarnos a través del enlace "Contacto" en el pie de página o enviando un correo electrónico a soporte@promocupones.com.',
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fade-in min-h-screen">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          Centro de Ayuda
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
          Encuentra respuestas a tus preguntas y aprende a sacar el máximo provecho de PromoCupones.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-[#2BD45A] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar ayuda (ej. karma, publicar, cuenta)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18191c] border border-[#2d2e33] text-white text-lg rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-[#2BD45A]/50 focus:ring-2 focus:ring-[#2BD45A]/20 transition-all placeholder:text-zinc-600 shadow-xl"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`p-6 rounded-2xl border transition-all text-left group ${
                  isSelected 
                    ? 'bg-[#2BD45A]/10 border-[#2BD45A] ring-1 ring-[#2BD45A]' 
                    : 'bg-[#18191c] border-[#2d2e33] hover:border-[#2BD45A]/30 hover:bg-[#222327]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-[#2BD45A] text-black' : `${cat.bg} ${cat.color}`}`}>
                  <Icon size={20} />
                </div>
                <h3 className={`font-bold mb-1 transition-colors ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                  {cat.title}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {FAQ_ITEMS.filter(i => i.category === cat.id).length} artículos
                </p>
              </button>
            )
          })}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => (
            <div 
              key={faq.id} 
              className="bg-[#18191c] border border-[#2d2e33] rounded-2xl overflow-hidden hover:border-[#2BD45A]/30 transition-all group"
            >
              <details className="group/details">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#2BD45A] transition-colors pr-8">
                    {faq.question}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-[#222327] flex items-center justify-center text-zinc-400 group-open/details:rotate-90 transition-transform">
                    <ChevronRight size={18} />
                  </div>
                </summary>
                <div className="px-6 pb-6 pt-0 text-zinc-400 leading-relaxed border-t border-[#2d2e33] mt-0 pt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  {faq.answer}
                </div>
              </details>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No encontramos respuestas</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Intenta con otras palabras clave o navega por las categorías.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
              className="mt-6 text-[#2BD45A] font-medium hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Still need help? */}
      <div className="mt-20 text-center border-t border-[#2d2e33] pt-12">
        <h3 className="text-2xl font-bold text-white mb-4">¿Aún necesitas ayuda?</h3>
        <p className="text-zinc-400 mb-8">
          Nuestro equipo de soporte está disponible para resolver cualquier duda que tengas.
        </p>
        <Link 
          href="/contact" 
          className="inline-flex items-center justify-center px-8 py-4 bg-[#222327] hover:bg-[#2d2e33] text-white font-bold rounded-xl border border-[#2d2e33] hover:border-[#2BD45A]/50 transition-all gap-2"
        >
          <MessageSquare size={18} />
          Contactar Soporte
        </Link>
      </div>
    </div>
  )
}
