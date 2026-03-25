'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nueva Contraseña</h1>
          <p className="text-zinc-400">Ingresa tu nueva contraseña segura</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            {/* Background decorative gradient */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#07B5A7]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#07B5A7]/20 rounded-full blur-3xl pointer-events-none"></div>

          {success ? (
            <div className="text-center py-4 relative z-10">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#07B5A7]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Tu contraseña ha sido restablecida correctamente. <br/>
                Te redirigiremos al inicio de sesión en unos segundos...
              </p>
              <Link 
                href="/auth/login"
                className="inline-flex items-center text-[#07B5A7] hover:underline"
              >
                Ir al inicio de sesión ahora <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6 relative z-10">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Nueva Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#07B5A7]/50 focus:border-[#07B5A7]/50 transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold py-3.5 rounded-xl shadow-lg shadow-[#07B5A7]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Actualizar Contraseña <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
