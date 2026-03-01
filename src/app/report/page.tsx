import { AlertTriangle, Shield, Flag } from 'lucide-react'

export default function ReportPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
          <Flag size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Reportar un Problema</h1>
        <p className="text-zinc-400">
          Ayúdanos a mantener la comunidad segura y libre de spam.
          Si has encontrado un problema técnico o contenido inapropiado, háznoslo saber.
        </p>
      </div>
      
      <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de reporte</label>
            <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50">
              <option>Contenido inapropiado / Spam</option>
              <option>Error técnico / Bug</option>
              <option>Problema con mi cuenta</option>
              <option>Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">URL afectada (opcional)</label>
            <input 
              type="text" 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50"
              placeholder="https://promocupones.com/..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Descripción del problema</label>
            <textarea 
              rows={5}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#2BD45A]/50 resize-none"
              placeholder="Describe detalladamente el problema que encontraste..."
            />
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-200">
            <Shield className="shrink-0" size={20} />
            <p>
              Revisamos todos los reportes manualmente. Si es necesario, nos pondremos en contacto contigo para solicitar más información.
            </p>
          </div>
          
          <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors">
            Enviar Reporte
          </button>
        </form>
      </div>
    </div>
  )
}
