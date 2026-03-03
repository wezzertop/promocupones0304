
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Política de Cookies</h1>
          <p className="text-zinc-400">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">¿Qué son las cookies?</h2>
            <p className="mb-4">
              Las cookies son pequeños archivos de texto que los sitios web que visitas colocan en tu ordenador o dispositivo móvil. Se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">Cómo utilizamos las cookies</h2>
            <p className="mb-4">
              Utilizamos cookies para entender cómo utilizas nuestro sitio web y para mejorar tu experiencia. Esto incluye cookies esenciales para el funcionamiento del sitio y cookies de análisis para ayudarnos a mejorar nuestro servicio.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-zinc-400">
              <li>Cookies esenciales: Necesarias para el funcionamiento básico del sitio.</li>
              <li>Cookies de rendimiento: Nos ayudan a entender cómo los visitantes interactúan con el sitio.</li>
              <li>Cookies de funcionalidad: Permiten recordar tus preferencias.</li>
            </ul>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">Control de cookies</h2>
            <p>
              Puedes controlar y/o eliminar las cookies como desees. Puedes eliminar todas las cookies que ya están en tu ordenador y puedes configurar la mayoría de los navegadores para que no las coloquen. Sin embargo, si haces esto, es posible que tengas que ajustar manualmente algunas preferencias cada vez que visites un sitio y que algunos servicios y funcionalidades no funcionen.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
