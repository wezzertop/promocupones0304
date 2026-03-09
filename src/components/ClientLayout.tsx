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
import { useEffect } from 'react'

interface ClientLayoutProps {
  children: React.ReactNode;
  user: SupabaseUser | null;
}

export default function ClientLayout({ children, user }: ClientLayoutProps) {
  const { isHeaderVisible, setHeaderVisible } = useUIStore()
  const pathname = usePathname()

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
    </div>
  )
}
