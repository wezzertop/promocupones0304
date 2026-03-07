'use client'

import { useUIStore } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export default function ToastSystem() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-xl
              ${toast.type === 'success' ? 'bg-[#18191c]/90 border-[#2BD45A]/20 text-white' : ''}
              ${toast.type === 'error' ? 'bg-[#18191c]/90 border-red-500/20 text-white' : ''}
              ${toast.type === 'info' ? 'bg-[#18191c]/90 border-blue-500/20 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-[#18191c]/90 border-yellow-500/20 text-white' : ''}
            `}
          >
            <div className={`mt-0.5 shrink-0
              ${toast.type === 'success' ? 'text-[#2BD45A]' : ''}
              ${toast.type === 'error' ? 'text-red-500' : ''}
              ${toast.type === 'info' ? 'text-blue-500' : ''}
              ${toast.type === 'warning' ? 'text-yellow-500' : ''}
            `}>
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
              {toast.type === 'warning' && <AlertTriangle size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.message}</h4>
              {toast.description && (
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
