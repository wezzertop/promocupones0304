
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-4">Política de Privacidad</h1>
          <p className="text-zinc-400">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">1. Recopilación de Información</h2>
            <p className="mb-4">
              PromoCupones respeta tu privacidad y se compromete a proteger los datos personales que puedas compartir con nosotros. Recopilamos información limitada necesaria para el funcionamiento de la plataforma.
            </p>
            <p>
              Esto puede incluir información proporcionada al registrarse, como correo electrónico y nombre de usuario, así como datos de uso anónimos para mejorar nuestros servicios.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">2. Uso de Cookies</h2>
            <p className="mb-4">
              Utilizamos cookies para mejorar la experiencia del usuario, recordar preferencias y analizar el tráfico del sitio. Al utilizar nuestro sitio, aceptas el uso de cookies de acuerdo con esta política.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">3. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad razonables para proteger tu información contra el acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
