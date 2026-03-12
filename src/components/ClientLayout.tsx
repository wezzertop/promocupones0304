'use client'

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import FloatingActionButton from "@/components/FloatingActionButton";
import AdSidebars from "@/components/AdSidebars";
import { useUIStore } from '@/lib/store'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import GamificationToast from '@/components/gamification/GamificationToast'
import ToastSystem from '@/components/ui/ToastSystem'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import GoogleTermsModal from '@/components/GoogleTermsModal'

interface ClientLayoutProps {
  children: React.ReactNode;
  user: SupabaseUser | null;
}

export default function ClientLayout({ children, user: initialUser }: ClientLayoutProps) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const { isHeaderVisible, setHeaderVisible } = useUIStore()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const router = useRouter()

  // Check for showTerms flag in URL
  useEffect(() => {
    if (searchParams?.get('showTerms') === 'true') {
      setIsTermsModalOpen(true)
    }
  }, [searchParams])

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
        <Header user={user} />
        <main className="flex-1 p-2 pt-[72px] md:p-4 md:pt-[80px] lg:p-8 lg:pt-8 max-w-[1920px] mx-auto w-full">
          {children}
        </main>
        <Footer />
      </div>
      <FloatingActionButton />
      <AdSidebars />
      <GamificationToast />
      <ToastSystem />
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
