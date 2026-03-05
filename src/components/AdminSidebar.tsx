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
  Bell,
  Flag,
  ShoppingCart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!userRole) return null // Or a skeleton loader

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f1012] border-r border-[#2d2e33] flex flex-col z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-[#2d2e33]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Panel<span className="text-blue-500">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
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
                      : 'text-gray-400 hover:bg-[#18191c] hover:text-white'
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
  )
}
