import { Mail, MapPin, Phone } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Contáctanos</h1>
      
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <p className="text-zinc-400 leading-relaxed">
            ¿Tienes alguna pregunta, sugerencia o problema? Estamos aquí para ayudarte.
            Completa el formulario o utiliza nuestros canales de contacto directo.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Mail className="text-[#2BD45A]" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Email</h3>
                <p className="text-sm text-zinc-400">soporte@promocupones.com</p>
                <p className="text-sm text-zinc-400">negocios@promocupones.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <MapPin className="text-[#2BD45A]" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Oficina</h3>
                <p className="text-sm text-zinc-400">
                  Av. Reforma 123, Piso 4<br />
                  Ciudad de México, CDMX 06500
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre</label>
              <input 
                type="text" 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50"
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input 
                type="email" 
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mensaje</label>
              <textarea 
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50 resize-none"
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>
            
            <button className="w-full bg-[#2BD45A] text-black font-bold py-2.5 rounded-lg text-sm hover:bg-[#25b84e] transition-colors">
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
