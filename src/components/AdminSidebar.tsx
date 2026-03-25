'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  Settings, 
  FileText,
  LogOut,
  Menu,
  X as CloseIcon,
  ShoppingCart,
  Flag,
  Bell
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Logo from '@/components/Logo'

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', roles: ['admin', 'moderator'] },
  { icon: ShieldAlert, label: 'Moderación', href: '/admin/moderation', roles: ['admin', 'moderator'] },
  { icon: Flag, label: 'Reportes', href: '/admin/reports', roles: ['admin', 'moderator'] },
  { icon: ShoppingCart, label: 'Scraper de Ofertas', href: '/admin/scraper', roles: ['admin', 'moderator'] },
  { icon: Users, label: 'Usuarios', href: '/admin/users', roles: ['admin'] },
  { icon: Bell, label: 'Notificaciones', href: '/admin/notifications', roles: ['admin'] },
  { icon: FileText, label: 'Logs de Auditoría', href: '/admin/logs', roles: ['admin'] },
  { icon: Settings, label: 'Configuración', href: '/admin/settings', roles: ['admin'] },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setUserRole((data as any)?.role || 'user')
      }
    }
    fetchRole()
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!userRole) return null

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#161616] border-b border-[#2d2e33] flex items-center justify-between px-4 z-[60]">
        <Link href="/" className="relative h-10 w-32 flex items-center">
          <Logo className="w-full h-full justify-start" iconClassName="h-8 w-auto drop-shadow-md" textClassName="text-xl" />
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-[#161616] border-r border-[#2d2e33] flex flex-col z-[58] transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area (Desktop) */}
        <div className="h-16 hidden lg:flex items-center px-6 border-b border-[#2d2e33]">
          <Link href="/" className="relative h-10 w-full flex items-center group">
            <Logo className="w-full h-full justify-start transition-transform group-hover:scale-105 origin-left" />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-20 lg:py-6 px-4 space-y-8">
          <div>
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Gestión
            </h3>
            <nav className="space-y-1">
              {MENU_ITEMS.filter(item => item.roles.includes(userRole)).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-500/10 text-blue-500' 
                        : 'text-gray-400 hover:bg-[#222222] hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-white transition-colors'} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-[#2d2e33]">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Spacer for mobile content to not be under header */}
      <div className="h-16 lg:hidden" />
    </>
  )
}
