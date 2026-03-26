'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Check, Shield, FileText, Users, ArrowRight } from 'lucide-react'

interface GoogleTermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function GoogleTermsModal({ isOpen, onClose, onAccept }: GoogleTermsModalProps) {
  const [accepted, setAccepted] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header with gradient line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#07B5A7] to-transparent opacity-50"></div>
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#07B5A7]/10 rounded-xl">
                <Shield size={24} className="text-[#07B5A7]" />
              </div>
              <h3 className="text-xl font-bold text-white">Casi listo...</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Para crear tu cuenta y unirte a la comunidad de <span className="text-white font-medium">Promocupones</span>, necesitamos que aceptes nuestras políticas de uso.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { icon: FileText, label: 'Términos y Condiciones', href: '/terms', desc: 'Reglas de uso del sitio' },
              { icon: Shield, label: 'Política de Privacidad', href: '/privacy', desc: 'Protección de tus datos' },
              { icon: Users, label: 'Reglas de la Comunidad', href: '/rules', desc: 'Convivencia y respeto' }
            ].map((item, i) => (
              <Link 
                key={i}
                href={item.href} 
                target="_blank"
                className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
              >
                <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-[#07B5A7]/10 transition-colors">
                  <item.icon size={18} className="text-gray-400 group-hover:text-[#07B5A7]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-[#07B5A7] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 mb-8">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                  accepted 
                    ? 'bg-[#07B5A7] border-[#07B5A7] shadow-[0_0_10px_rgba(43,212,90,0.4)]' 
                    : 'border-gray-600 group-hover:border-gray-500'
                }`}>
                  {accepted && <Check size={16} className="text-black stroke-[3]" />}
                </div>
              </div>
              <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                He leído y acepto los <span className="text-white font-medium">Términos</span>, la <span className="text-white font-medium">Privacidad</span> y las <span className="text-white font-medium">Reglas</span> de la comunidad.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:text-white hover:bg-surface-hover transition-all font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={!accepted}
              onClick={onAccept}
              className="flex-1 px-4 py-3 rounded-xl bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold transition-all shadow-lg shadow-[#07B5A7]/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 group/btn"
            >
              Continuar
              <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
