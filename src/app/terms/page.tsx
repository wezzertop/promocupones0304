
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white mb-4">Términos y Condiciones</h1>
          <p className="text-zinc-400">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">1. Exención de Responsabilidad de Precios</h2>
            <p className="mb-4">
              PromoCupones es una plataforma informativa que recopila ofertas y cupones de diversas tiendas en línea. No somos una tienda ni vendemos productos directamente.
            </p>
            <p className="mb-4">
              <strong>Importante:</strong> Todos los precios, ofertas y promociones mostrados en este sitio están sujetos a cambios sin previo aviso por parte de los vendedores originales. PromoCupones no garantiza la disponibilidad, el precio o la exactitud de las ofertas en todo momento.
            </p>
            <p>
              Las ofertas pueden cambiar, expirar o agotarse en cualquier periodo de tiempo, ya sea corto o largo. No nos hacemos responsables de las discrepancias entre el precio mostrado aquí y el precio final en la tienda del vendedor.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">2. Uso del Servicio</h2>
            <p className="mb-4">
              Al acceder y utilizar PromoCupones, aceptas que el uso del sitio es bajo tu propio riesgo. La plataforma se proporciona "tal cual" y "según disponibilidad".
            </p>
            <p>
              Es responsabilidad exclusiva del usuario verificar todas las condiciones, precios, costos de envío y detalles del producto directamente en el sitio web del vendedor antes de realizar cualquier compra.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">3. Enlaces a Terceros</h2>
            <p>
              Este sitio web contiene enlaces a sitios web de terceros que no son propiedad ni están controlados por PromoCupones. No tenemos control sobre, y no asumimos responsabilidad por, el contenido, las políticas de privacidad o las prácticas de sitios web de terceros.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">4. Propiedad Intelectual</h2>
            <p className="mb-4">
              Todo el contenido generado por los usuarios (comentarios, ofertas, imágenes) sigue siendo propiedad de sus respectivos autores, pero al publicarlo en PromoCupones, nos otorgas una licencia mundial, no exclusiva y libre de regalías para usar, reproducir y mostrar dicho contenido.
            </p>
            <p>
              Las marcas registradas y logotipos de las tiendas y productos mencionados pertenecen a sus respectivos propietarios y se utilizan únicamente con fines informativos.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">5. Conducta del Usuario</h2>
            <p className="mb-4">
              Te comprometes a utilizar la plataforma de manera legal y respetuosa. Queda prohibido:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Publicar contenido falso, engañoso o fraudulento.</li>
              <li>Acosar, amenazar o insultar a otros usuarios.</li>
              <li>Utilizar bots o scripts automatizados para manipular el sistema de votación o karma.</li>
              <li>Publicar enlaces de afiliados sin revelar dicha relación (spam).</li>
            </ul>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">6. Terminación</h2>
            <p>
              Nos reservamos el derecho de suspender o terminar tu cuenta en cualquier momento, sin previo aviso, si violas estos Términos y Condiciones o si consideramos que tu conducta es perjudicial para la comunidad o la plataforma.
            </p>
          </section>

          <section className="bg-[#18191c] p-6 rounded-2xl border border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white mb-4">7. Limitación de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley, PromoCupones no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluyendo pero no limitado a pérdida de beneficios, datos o uso, que surja de tu acceso o uso de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
