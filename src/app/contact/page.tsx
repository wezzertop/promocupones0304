'use client'

import { Mail, MapPin, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { submitContactForm } from './actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit"
      disabled={pending}
      className="w-full bg-[#2BD45A] text-black font-bold py-2.5 rounded-lg text-sm hover:bg-[#25b84e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Enviando...
        </>
      ) : (
        <>
          <Send size={18} />
          Enviar Mensaje
        </>
      )}
    </button>
  )
}

export default function ContactPage() {
  const [formState, setFormState] = useState<any>(null)
  
  async function handleSubmit(formData: FormData) {
    const result = await submitContactForm(null, formData)
    setFormState(result)
    
    if (result?.success) {
      // Optional: Reset form via ref or just let the success message show
      const form = document.querySelector('form') as HTMLFormElement
      form?.reset()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
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
        
        <div className="bg-[#18191c] rounded-2xl p-6 border border-[#2d2e33]">
          {formState?.success ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                <Send size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">¡Mensaje Enviado!</h3>
              <p className="text-zinc-400 max-w-xs">
                Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.
              </p>
              <button 
                onClick={() => setFormState(null)}
                className="mt-4 text-[#2BD45A] hover:underline text-sm"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              {formState?.error && typeof formState.error === 'string' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {formState.error}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre</label>
                <input 
                  id="name"
                  name="name"
                  type="text" 
                  required
                  className="w-full bg-[#222327] border border-[#2d2e33] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50 transition-colors"
                  placeholder="Tu nombre completo"
                />
                {formState?.error?.name && (
                  <p className="text-red-400 text-xs mt-1">{formState.error.name[0]}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  required
                  className="w-full bg-[#222327] border border-[#2d2e33] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50 transition-colors"
                  placeholder="tu@email.com"
                />
                {formState?.error?.email && (
                  <p className="text-red-400 text-xs mt-1">{formState.error.email[0]}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-xs font-medium text-zinc-400 mb-1.5">Mensaje</label>
                <textarea 
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full bg-[#222327] border border-[#2d2e33] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50 resize-none transition-colors"
                  placeholder="¿En qué podemos ayudarte?"
                />
                {formState?.error?.message && (
                  <p className="text-red-400 text-xs mt-1">{formState.error.message[0]}</p>
                )}
              </div>
              
              <SubmitButton />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
