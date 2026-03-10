import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  // Check for errors returned by the provider
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  if (error) {
    console.error('Auth error from provider:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (!sessionError) {
      // If we have a next parameter, redirect to it
      if (next && next !== '/') {
         return NextResponse.redirect(`${origin}${next}`)
      }
      // Otherwise, redirect to home
      return NextResponse.redirect(`${origin}/`)
    } else {
        console.error('Auth callback error:', sessionError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No+code+provided`)
}
