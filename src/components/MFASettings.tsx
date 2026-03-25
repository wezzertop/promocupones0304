'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, Copy, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MFASettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null) // The TOTP secret URI
  const [verifyCode, setVerifyCode] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) {
      console.error(error)
    } else {
      if (data.currentLevel === 'aal2') {
        setIsEnabled(true)
      } else {
        // Check if factors exist even if not currently AAL2 (maybe just not logged in with it yet)
        const { data: factors } = await supabase.auth.mfa.listFactors()
        if (factors && factors.totp.length > 0 && factors.totp[0].status === 'verified') {
            setIsEnabled(true)
        } else {
            setIsEnabled(false)
        }
      }
    }
    setLoading(false)
  }

  const handleEnroll = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) throw error

      setFactorId(data.id)
      setQrCode(data.totp.uri)
      setStep('setup')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!factorId) return
    
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      })

      if (error) throw error

      setIsEnabled(true)
      setStep('initial')
      alert('Autenticación de dos factores activada correctamente.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('¿Estás seguro de desactivar la autenticación en dos pasos? Tu cuenta será menos segura.')) return

    setLoading(true)
    try {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        if (!factors || factors.totp.length === 0) return

        const factorIdToUnenroll = factors.totp[0].id
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factorIdToUnenroll })
        
        if (error) throw error
        
        setIsEnabled(false)
        alert('MFA desactivado.')
    } catch (err: any) {
        setError(err.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="bg-[#222222] border border-[#2d2e33] rounded-3xl overflow-hidden mt-8">
        <div className="p-6 border-b border-[#2d2e33]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-[#07B5A7]" size={20} />
                Autenticación en dos pasos (MFA)
            </h2>
        </div>

        <div className="p-6">
            {loading && step === 'initial' ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-[#07B5A7]" />
                </div>
            ) : isEnabled ? (
                <div className="flex items-center justify-between p-4 bg-[#07B5A7]/10 border border-[#07B5A7]/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-[#07B5A7]" size={24} />
                        <div>
                            <h3 className="font-bold text-white">MFA Activado</h3>
                            <p className="text-sm text-gray-400">Tu cuenta está protegida con verificación en dos pasos.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleDisable}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold transition-colors"
                    >
                        Desactivar
                    </button>
                </div>
            ) : step === 'initial' ? (
                <div className="space-y-4">
                    <p className="text-gray-400">
                        Añade una capa extra de seguridad a tu cuenta requiriendo un código desde tu aplicación de autenticación (como Google Authenticator o Authy) al iniciar sesión.
                    </p>
                    <button 
                        onClick={handleEnroll}
                        className="px-6 py-3 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#07B5A7]/20 flex items-center gap-2"
                    >
                        <ShieldCheck size={18} />
                        Activar MFA
                    </button>
                </div>
            ) : step === 'setup' ? (
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-2">Escanea el código QR</h3>
                        <p className="text-gray-400 text-sm">
                            Abre tu aplicación de autenticación y escanea el siguiente código.
                        </p>
                    </div>

                    <div className="flex justify-center bg-white p-4 rounded-xl w-fit mx-auto">
                        {qrCode && <QRCodeSVG value={qrCode} size={192} />}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Código de verificación</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value)}
                                placeholder="123456"
                                className="flex-1 bg-[#222327] border border-[#2d2e33] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#07B5A7] tracking-widest text-center text-lg"
                                maxLength={6}
                            />
                            <button 
                                onClick={handleVerify}
                                disabled={verifyCode.length !== 6 || loading}
                                className="px-6 bg-[#07B5A7] hover:bg-[#25b84e] text-black font-bold rounded-xl disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Verificar'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}
                    
                    <button onClick={() => setStep('initial')} className="text-sm text-gray-500 hover:text-white underline w-full text-center">
                        Cancelar
                    </button>
                </div>
            ) : null}
        </div>
    </div>
  )
}
