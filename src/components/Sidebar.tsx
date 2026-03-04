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

const MENU_ITEMS = [
  { icon: Home, label: 'Inicio', href: '/' },
  { icon: Flame, label: 'Lo más Hot', href: '/hot' },
  { icon: Tag, label: 'Ofertas', href: '/deals' },
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
  const { isSidebarOpen, isHeaderVisible, closeSidebar } = useUIStore()

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-[#0f1012] border-r border-[#2d2e33] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>

        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#2d2e33]">
          <Link href="/" className="flex items-center gap-2 group" onClick={closeSidebar}>
            <div className="w-8 h-8 rounded-lg bg-[#2BD45A] flex items-center justify-center text-black font-bold text-xl group-hover:rotate-12 transition-transform">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Promo<span className="text-[#2BD45A]">Cupones</span>
            </span>
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
                        ? 'bg-[#2BD45A]/10 text-[#2BD45A]' 
                        : 'text-gray-400 hover:bg-[#18191c] hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#2BD45A]' : 'text-gray-500 group-hover:text-white transition-colors'} />
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
                        ? 'bg-[#2BD45A]/10 text-[#2BD45A]' 
                        : 'text-gray-400 hover:bg-[#18191c] hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#2BD45A]' : 'text-gray-500 group-hover:text-white transition-colors'} />
                    {item.label}
                  </Link>
                )
              })}
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-[#18191c] hover:text-white transition-all">
                <div className="w-5 flex justify-center">
                  <MoreHorizontal size={20} />
                </div>
                Ver todas
              </button>
            </nav>
          </div>
        </div>
        {/* Footer Area */}
        {/* Eliminado porque ahora hay un botón flotante */}
      </aside>
    </>
  )
}
