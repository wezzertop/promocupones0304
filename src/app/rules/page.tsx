
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, MessageSquare, AlertTriangle, UserCheck, Heart } from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Reglas de la Comunidad</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Para mantener PromoCupones como un espacio seguro y útil para todos, hemos establecido estas reglas básicas. Al participar, aceptas seguir estos lineamientos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33] hover:border-[#2BD45A]/30 transition-colors group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">1. Sé Respetuoso</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Trata a los demás usuarios con respeto y cortesía. No toleramos el acoso, los insultos, el discurso de odio o cualquier forma de discriminación. Estamos aquí para ayudarnos a ahorrar, no para pelear.
          </p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33] hover:border-[#2BD45A]/30 transition-colors group">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">2. Ofertas Reales y Verificables</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Publica solo ofertas que hayas verificado. Asegúrate de incluir enlaces funcionales, precios correctos y detalles claros sobre cómo obtener el descuento. No publiques rumores o estafas.
          </p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33] hover:border-[#2BD45A]/30 transition-colors group">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-4 group-hover:scale-110 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">3. No Spam ni Autopromoción</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            No utilices la plataforma para promocionar tus propios productos o servicios de manera masiva. Los enlaces de referidos están permitidos solo si se indican claramente y aportan valor real a la comunidad.
          </p>
        </div>

        <div className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33] hover:border-[#2BD45A]/30 transition-colors group">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
            <UserCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">4. Una Cuenta por Persona</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            No crees múltiples cuentas para manipular votos o comentarios. El sistema de karma está diseñado para recompensar la participación genuina. El abuso resultará en la suspensión permanente.
          </p>
        </div>
      </div>

      <div className="mt-12 bg-[#2BD45A]/10 border border-[#2BD45A]/20 rounded-2xl p-8 text-center">
        <Heart className="w-12 h-12 text-[#2BD45A] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Ayúdanos a mejorar</h3>
        <p className="text-zinc-300 max-w-xl mx-auto mb-6">
          Si ves contenido que viola estas reglas, por favor repórtalo usando el botón de "Reportar" en la publicación o comentario correspondiente.
        </p>
        <Link 
          href="/contact" 
          className="inline-flex items-center justify-center px-6 py-3 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-colors"
        >
          Contactar Soporte
        </Link>
      </div>
    </div>
  )
}
