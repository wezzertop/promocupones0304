import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // --- SECURITY HEADERS ---
  
  // 1. CSP (Content Security Policy)
  // Domains for external services
  const GOOGLE_DOMAINS = 'https://apis.google.com https://www.google.com https://www.gstatic.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com'
  const SUPABASE_DOMAINS = 'https://*.supabase.co wss://*.supabase.co'
  const ANALYTICS_DOMAINS = 'https://va.vercel-scripts.com'
  const CLOUDFLARE_DOMAINS = 'https://challenges.cloudflare.com'
  const AD_DOMAINS = 'https://crateworkshop.com https://www.highperformanceformat.com'

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GOOGLE_DOMAINS} ${SUPABASE_DOMAINS} ${ANALYTICS_DOMAINS} ${CLOUDFLARE_DOMAINS} ${AD_DOMAINS} https:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: https://i.imgur.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' ${SUPABASE_DOMAINS} https://*.googleapis.com https://api.ipify.org ${AD_DOMAINS} https:;
    frame-src 'self' https://accounts.google.com https://www.google.com ${CLOUDFLARE_DOMAINS} ${AD_DOMAINS} https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  // 2. HSTS (Strict-Transport-Security)
  // Force HTTPS for 1 year, include subdomains
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // 3. X-Frame-Options
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // 4. X-Content-Type-Options
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // 5. Referrer-Policy
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // 6. Permissions-Policy
  // Restrict browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()')

  // --- SUPABASE AUTH ---

  // Validate env vars are present before attempting connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Middleware] Missing Supabase env vars. Skipping auth check.')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (error) {
    // Supabase is unreachable (timeout, no internet, etc.)
    // Log once and continue without auth check — app remains accessible
    console.error('[Middleware] Supabase auth check failed, continuing without auth:', (error as Error).message)
  }

  // --- ROUTE PROTECTION ---

  // Protected routes
  const protectedRoutes = ['/perfil', '/publicar', '/mis-publicaciones', '/ajustes', '/admin', '/notificaciones', '/report']
  
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Admin routes protection (Additional check)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    
    // Note: Role verification is handled in layout/page for performance,
    // but strict auth is enforced here.
  }

  // Auth routes (redirect to home if already logged in)
  const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
  if (authRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
