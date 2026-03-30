'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Tag, 
  Ticket, 
  MessageSquare, 
  Flame, 
  Laptop, 
  Shirt, 
  Utensils, 
  Plane, 
  Dumbbell,
  Gamepad2,
  MoreHorizontal
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import Image from 'next/image'
import Logo from '@/components/Logo'

const MENU_ITEMS = [
  { icon: Home, label: 'Inicio', href: '/' },
  { icon: Flame, label: 'Lo más Hot', href: '/hot' },
  { icon: Tag, label: 'Descuentos', href: '/deals' },
  { icon: Ticket, label: 'Cupones', href: '/cupones' },
  { icon: MessageSquare, label: 'Discusiones', href: '/discusiones' },
]

const CATEGORIES = [
  { icon: Laptop, label: 'Tecnología', href: '/categoria/tecnologia' },
  { icon: Shirt, label: 'Moda', href: '/categoria/moda' },
  { icon: Utensils, label: 'Alimentos', href: '/categoria/alimentos' },
  { icon: Gamepad2, label: 'Gaming', href: '/categoria/gaming' },
  { icon: Plane, label: 'Viajes', href: '/categoria/viajes' },
  { icon: Dumbbell, label: 'Deportes', href: '/categoria/deportes' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useUIStore()

  // The sidebar is always an overlay (never pushes content)
  // Controlled by isSidebarOpen for both mobile and desktop
  const sidebarStyle: React.CSSProperties = {
    transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 300ms ease-in-out',
  }

  return (
    <>
      {/* Backdrop for both mobile and desktop */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45 }}
          onClick={closeSidebar}
        />
      )}

      <aside
        className="fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex flex-col z-50"
        style={sidebarStyle}
      >

        {/* Logo Area */}
        <div className="h-14 flex items-center justify-center border-b border-border">
          <Link href="/" className="relative h-10 w-[85%] block group" onClick={closeSidebar}>
            <Logo className="w-full h-full justify-center transition-transform group-hover:scale-105" iconClassName="h-7 w-auto drop-shadow-md" textClassName="text-xl" />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {/* Main Menu */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Explorar
            </h3>
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-[#07B5A7]/10 text-[#07B5A7]' 
                        : 'text-gray-400 hover:bg-surface hover:text-foreground'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#07B5A7]' : 'text-gray-500 group-hover:text-foreground transition-colors'} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Categories */}
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Categorías
            </h3>
            <nav className="space-y-1">
              {CATEGORIES.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-[#07B5A7]/10 text-[#07B5A7]' 
                        : 'text-gray-400 hover:bg-surface hover:text-foreground'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#07B5A7]' : 'text-gray-500 group-hover:text-foreground transition-colors'} />
                    {item.label}
                  </Link>
                )
              })}
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-surface hover:text-foreground transition-all">
                <div className="w-5 flex justify-center">
                  <MoreHorizontal size={20} />
                </div>
                Ver todas
              </button>
            </nav>
          </div>
        </div>
        {/* Footer Area */}
        {/* App Download Area */}
        <div className="p-4 border-t border-border">
          <h3 className="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Descarga la App</h3>
          <div className="flex flex-col gap-2">
            <Link href="#" className="block w-[140px] hover:opacity-80 transition-opacity">
              <Image src="/google-play-badge.svg" alt="Descargar en Google Play" width={160} height={47} className="w-full h-auto drop-shadow-sm" unoptimized />
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
