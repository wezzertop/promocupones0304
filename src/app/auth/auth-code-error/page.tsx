'use client'

import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="bg-[#161616] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Error de Autenticación</h1>
          <p className="text-zinc-400 mb-8 text-center break-words max-w-full">
            {error ? `Detalle del error: ${error}` : 'Hubo un problema al verificar tu cuenta. Esto puede suceder si el enlace ha expirado o ya ha sido utilizado.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link 
              href="/auth/login" 
              className="flex-1 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/" 
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
