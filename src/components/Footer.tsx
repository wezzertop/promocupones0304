import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2d2e33] bg-[#0f1012]">
      <div className="max-w-[1920px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-[#2BD45A] flex items-center justify-center text-black font-bold text-xl">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Promo<span className="text-[#2BD45A]">Cupones</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              La plataforma definitiva para encontrar y compartir las mejores ofertas.
              Únete a miles de compradores inteligentes hoy mismo.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={Facebook} />
              <SocialLink icon={Twitter} />
              <SocialLink icon={Instagram} />
              <SocialLink icon={Youtube} />
            </div>
          </div>

          {/* Links */}
          <FooterColumn 
            title="Plataforma" 
            links={[
              { label: 'Explorar Ofertas', href: '/deals' },
              { label: 'Cupones Exclusivos', href: '/cupones' },
              { label: 'Comunidad', href: '/discusiones' },
              { label: 'Blog Oficial', href: '/blog' },
            ]} 
          />
          
          <FooterColumn 
            title="Soporte" 
            links={[
              { label: 'Centro de Ayuda', href: '/help' },
              { label: 'Reglas de la Comunidad', href: '/rules' },
              { label: 'Reportar un Problema', href: '/report' },
              { label: 'Contacto', href: '/contact' },
            ]} 
          />

          <div className="col-span-1">
            <h3 className="font-bold text-white mb-6">Mantente actualizado</h3>
            <div className="bg-[#18191c] p-1.5 rounded-xl border border-[#2d2e33] flex items-center mb-4 focus-within:border-[#2BD45A] transition-colors">
              <Mail className="ml-3 text-gray-500" size={18} />
              <input 
                type="email" 
                placeholder="tu@email.com" 
                className="bg-transparent border-none text-white text-sm w-full focus:ring-0 px-3 py-2"
              />
              <button className="bg-[#2BD45A] text-black p-2 rounded-lg hover:bg-[#25b84e] transition-colors">
                <Heart size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Recibe las mejores ofertas cada semana. Sin spam, prometido.
            </p>
          </div>
        </div>

        {/* Legal Disclaimer Section */}
        <div className="border-t border-[#2d2e33] py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-400">Exención de Responsabilidad de Precios</h4>
              <p>
                Todos los precios, ofertas y promociones mostrados en PromoCupones están sujetos a cambios sin previo aviso por parte de los vendedores y tiendas originales. No nos hacemos responsables de las discrepancias entre el precio listado en nuestra plataforma y el precio final en el sitio del vendedor.
              </p>
              <p>
                Las ofertas pueden cambiar, expirar o agotarse en cualquier periodo de tiempo, ya sea corto o largo. PromoCupones actúa únicamente como una plataforma informativa y no garantiza la disponibilidad ni el precio de los productos.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-400">Términos de Uso</h4>
              <p>
                Al utilizar nuestros servicios, usted reconoce y acepta que PromoCupones no es responsable de ningún daño, pérdida o inconveniente derivado de cambios en los precios, disponibilidad de productos o errores en la información proporcionada.
              </p>
              <p>
                Es responsabilidad exclusiva del usuario verificar todas las condiciones, precios y detalles directamente en la tienda del vendedor antes de realizar cualquier compra.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-[#2d2e33] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} PromoCupones. Hecho con 💚 por la comunidad.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Términos</Link>
            <Link href="/cookies" className="hover:text-gray-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ icon: Icon }: { icon: any }) {
  return (
    <Link href="#" className="w-10 h-10 rounded-lg bg-[#18191c] border border-[#2d2e33] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2BD45A] hover:bg-[#2BD45A]/10 transition-all">
      <Icon size={18} />
    </Link>
  )
}

function FooterColumn({ title, links }: { title: string, links: { label: string, href: string }[] }) {
  return (
    <div>
      <h3 className="font-bold text-white mb-6">{title}</h3>
      <ul className="space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-gray-500 hover:text-[#2BD45A] transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
