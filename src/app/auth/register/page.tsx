'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import Captcha from '@/components/Captcha'
import GoogleTermsModal from '@/components/GoogleTermsModal'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check Captcha if key is present
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
        setError('Por favor completa el captcha.')
        return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback` : undefined,
        captchaToken: captchaToken || undefined,
      },
    })

    if (error) {
      // Supabase sometimes returns "invalid email" for duplicate emails depending on config
      if (error.message.includes('invalid') && error.message.includes('email')) {
        setError('El email no es válido o ya está registrado.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      if (data?.user && !data?.session) {
        setSuccess(true)
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    }
  }

  const handleGoogleLoginClick = () => {
    setIsGoogleModalOpen(true)
  }

  const handleGoogleLogin = async () => {
    setIsGoogleModalOpen(false)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?terms_accepted=true`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
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
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#07B5A7]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#07B5A7]/20 rounded-full blur-3xl pointer-events-none"></div>

          {success ? (
            <div className="text-center py-4 relative z-10">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#07B5A7]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Revisa tu correo!</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Hemos enviado un enlace de confirmación a <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
              <Link 
                href="/auth/login"
                className="inline-flex items-center text-[#07B5A7] hover:underline"
              >
                Ir al inicio de sesión <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
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
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#07B5A7]/50 focus:border-[#07B5A7]/50 transition-all placeholder:text-zinc-600"
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
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#07B5A7]/50 focus:border-[#07B5A7]/50 transition-all placeholder:text-zinc-600"
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
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#07B5A7]/50 focus:border-[#07B5A7]/50 transition-all placeholder:text-zinc-600"
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
                    className="w-4 h-4 rounded border-zinc-600 bg-black/20 text-[#07B5A7] focus:ring-[#07B5A7]/50 focus:ring-offset-0"
                  />
                </div>
                <div className="ml-2 text-xs">
                  <label htmlFor="terms" className="text-zinc-400">
                    Acepto los{' '}
                    <Link href="/terms" className="text-[#07B5A7] hover:underline" target="_blank">
                      Términos y Condiciones
                    </Link>
                    , la{' '}
                    <Link href="/privacy" className="text-[#07B5A7] hover:underline" target="_blank">
                      Política de Privacidad
                    </Link>{' '}
                    y las{' '}
                    <Link href="/rules" className="text-[#07B5A7] hover:underline" target="_blank">
                      Reglas de la Comunidad
                    </Link>
                    .
                  </label>
                </div>
              </div>

              <Captcha 
                onVerify={(token) => setCaptchaToken(token)}
                onError={() => setError('Error en el captcha. Inténtalo de nuevo.')}
              />
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
                  Crear Cuenta <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1e1e1e] text-zinc-500 rounded-full">O regístrate con</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLoginClick}
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </form>
          )}

          <GoogleTermsModal 
            isOpen={isGoogleModalOpen} 
            onClose={() => setIsGoogleModalOpen(false)} 
            onAccept={handleGoogleLogin} 
          />
        </div>

        <p className="text-center mt-6 text-zinc-400">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/auth/login" className="text-[#07B5A7] hover:text-[#25b84e] font-medium transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
