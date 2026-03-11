'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function logSecurityEvent(
  eventType: 'login' | 'logout' | 'password_change' | 'mfa_enroll' | 'suspicious_activity' | 'admin_action' | 'rate_limit_exceeded',
  details: Record<string, any> = {}
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  const { error } = await supabase.from('security_logs').insert({
    user_id: user?.id || null,
    event_type: eventType,
    ip_address: ip,
    user_agent: userAgent,
    details: details
  })

  if (error) {
    console.error('Failed to log security event:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function checkRateLimit(key: string, limit: number = 10, windowSeconds: number = 60) {
    const supabase = await createClient()
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    
    // Composite key: action + IP (or user ID if available, but let's stick to IP/Action for broad protection)
    const { data: { user } } = await supabase.auth.getUser()
    const finalKey = user ? `${key}:${user.id}` : `${key}:${ip}`

    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: finalKey,
        p_limit: limit,
        p_window_seconds: windowSeconds
    })

    if (error) {
        console.error('Rate limit check failed:', error)
        // Fail open or closed? Closed for security.
        return { allowed: false, error: error.message }
    }

    if (!data) {
        // Log the violation
        await logSecurityEvent('rate_limit_exceeded', { key: finalKey, limit, windowSeconds })
        return { allowed: false, error: 'Demasiadas solicitudes. Por favor espera un momento.' }
    }

    return { allowed: true }
}
