'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { useState, useEffect } from 'react'

interface CaptchaProps {
    onVerify: (token: string) => void
    onError?: () => void
}

export default function Captcha({ onVerify, onError }: CaptchaProps) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    // If no site key is provided in env, we can't render the captcha.
    // In dev, we might want to skip or show a placeholder.
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()

    if (!siteKey) {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs">
                Turnstile Site Key no configurada. (NEXT_PUBLIC_TURNSTILE_SITE_KEY)
            </div>
        )
    }

    if (!mounted) return <div className="h-[72px] w-full animate-pulse bg-white/5 rounded-xl" />

    return (
        <div className="w-full flex justify-center my-4 min-h-[72px]">
            <Turnstile 
                siteKey={siteKey}
                onSuccess={onVerify}
                onError={(err) => {
                    console.error('Turnstile Error:', err)
                    if (onError) onError()
                }}
                options={{
                    theme: 'dark',
                    size: 'flexible',
                    language: 'es'
                }}
            />
        </div>
    )
}
