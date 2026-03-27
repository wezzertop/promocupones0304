'use client'

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import FloatingActionButton from "@/components/FloatingActionButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import AdSidebars from "@/components/AdSidebars";
import { useUIStore } from '@/lib/store'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import GamificationToast from '@/components/gamification/GamificationToast'
import ToastSystem from '@/components/ui/ToastSystem'
import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import GoogleTermsModal from '@/components/GoogleTermsModal'

const NativeAppBridge = dynamic(() => import('@/components/NativeAppBridge'), { ssr: false })

interface ClientLayoutProps {
  children: React.ReactNode;
  user: SupabaseUser | null;
}

function TermsCheck({ onShowTerms }: { onShowTerms: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get('showTerms') === 'true') {
      onShowTerms()
    }
  }, [searchParams, onShowTerms])
  return null
}

export default function ClientLayout({ children, user: initialUser }: ClientLayoutProps) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const { isHeaderVisible, setHeaderVisible } = useUIStore()
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()

  // Update user when prop changes (server-side sync)
  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  // Client-side auth listener to catch changes immediately
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setUser(session?.user || null)
        // If we were on a login page and just signed in, refresh to get server state
        if (pathname?.startsWith('/auth/')) {
           router.refresh()
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, pathname, router])

  // Native App Deep Link Listener for OAuth
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        const listener = App.addListener('appUrlOpen', async (event) => {
          const url = event.url;
          
          if (url.includes('auth/callback')) {
            // Usually tokens are passed in the hash: #access_token=...&refresh_token=...
            const hashIndex = url.indexOf('#');
            if (hashIndex !== -1) {
              const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
              const access_token = hashParams.get('access_token');
              const refresh_token = hashParams.get('refresh_token');
              
              if (access_token && refresh_token) {
                await supabase.auth.setSession({
                  access_token,
                  refresh_token
                });
                router.push('/');
                router.refresh();
              }
            }
          }
        });
        
        return () => {
          listener.then(l => l.remove());
        }
      }).catch(console.error);
    }
  }, [supabase, router]);

  // Force header/sidebar visible on specific routes
  useEffect(() => {
    const alwaysVisibleRoutes = ['/oferta', '/perfil', '/ajustes', '/usuario']
    if (alwaysVisibleRoutes.some(route => pathname?.startsWith(route))) {
      setHeaderVisible(true)
    }
  }, [pathname, setHeaderVisible])

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out ${isHeaderVisible ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <Suspense fallback={<div className="h-14 bg-background/80 w-full border-b border-border"></div>}>
          <Header user={user} />
        </Suspense>
        <main className="flex-1 p-2 pt-14 pb-20 md:p-4 md:pt-[80px] md:pb-4 lg:p-8 lg:pt-8 lg:pb-8 max-w-[1920px] mx-auto w-full">
          {children}
        </main>
        <Footer />
        <MobileBottomNav user={user} />
      </div>
      <FloatingActionButton />
      <AdSidebars />
      <GamificationToast />
      <ToastSystem />
      <Suspense fallback={null}>
        <TermsCheck onShowTerms={() => setIsTermsModalOpen(true)} />
      </Suspense>
      <NativeAppBridge user={user} />
      <GoogleTermsModal 
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => {
          setIsTermsModalOpen(false)
          // Clean the URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }}
      />
    </div>
  )
}
