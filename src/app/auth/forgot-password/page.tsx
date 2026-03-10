'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
          <p className="text-zinc-400">Te enviaremos un enlace para restablecerla</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            {/* Background decorative gradient */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#2BD45A]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#2BD45A]/20 rounded-full blur-3xl pointer-events-none"></div>

          {success ? (
            <div className="text-center py-4 relative z-10">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#2BD45A]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Revisa tu correo!</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Hemos enviado un enlace de recuperación a <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="text-zinc-400 hover:text-white text-sm underline"
                >
                  Intentar con otro correo
                </button>
                <div className="block">
                  <Link 
                    href="/auth/login"
                    className="inline-flex items-center text-[#2BD45A] hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold py-3.5 rounded-xl shadow-lg shadow-[#2BD45A]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Enviar enlace <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-zinc-400">
          ¿Te acordaste?{' '}
          <Link href="/auth/login" className="text-[#2BD45A] hover:text-[#25b84e] font-medium transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
