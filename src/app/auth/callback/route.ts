import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const alreadyAccepted = searchParams.get('terms_accepted') === 'true'
  
  // Check for errors returned by the provider
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  if (error) {
    console.error('Auth error from provider:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError && data?.user) {
      const user = data.user
      // Check if it's a new user (created in the last 10 seconds)
      const isNewUser = new Date(user.created_at).getTime() > Date.now() - 10000
      
      let redirectUrl = `${origin}${next}`
      if (isNewUser && !alreadyAccepted) {
        // Add a flag to show terms if it's a new user and hasn't accepted them yet
        const url = new URL(redirectUrl)
        url.searchParams.set('showTerms', 'true')
        redirectUrl = url.toString()
      }
      
      return NextResponse.redirect(redirectUrl)
    } else {
        console.error('Auth callback error:', sessionError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError?.message || 'Unknown error')}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No+code+provided`)
}
