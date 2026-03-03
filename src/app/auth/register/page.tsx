'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-zinc-400">Únete a nuestra comunidad de ofertas</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            {/* Background decorative gradient */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#2BD45A]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#2BD45A]/20 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleRegister} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Nombre de usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                    placeholder="tu_usuario"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2BD45A]/50 focus:border-[#2BD45A]/50 transition-all placeholder:text-zinc-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 rounded border-zinc-600 bg-black/20 text-[#2BD45A] focus:ring-[#2BD45A]/50 focus:ring-offset-0"
                  />
                </div>
                <div className="ml-2 text-xs">
                  <label htmlFor="terms" className="text-zinc-400">
                    Acepto los{' '}
                    <Link href="/terms" className="text-[#2BD45A] hover:underline" target="_blank">
                      Términos y Condiciones
                    </Link>
                    , la{' '}
                    <Link href="/privacy" className="text-[#2BD45A] hover:underline" target="_blank">
                      Política de Privacidad
                    </Link>{' '}
                    y las{' '}
                    <Link href="/rules" className="text-[#2BD45A] hover:underline" target="_blank">
                      Reglas de la Comunidad
                    </Link>
                    .
                  </label>
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
                  Crear Cuenta <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-zinc-400">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/auth/login" className="text-[#2BD45A] hover:text-[#25b84e] font-medium transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
