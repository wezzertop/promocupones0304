'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, User, Lock, Mail, Moon, Globe, LogOut, Save, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleSave = () => {
    setIsLoading(true)
    // Simulate save
    setTimeout(() => {
      setIsLoading(false)
      alert('Configuración guardada correctamente')
    }, 1000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-gray-400">Gestiona tus preferencias y cuenta</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2.5 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : (
            <>
              <Save size={18} />
              Guardar
            </>
          )}
        </button>
      </div>

      {/* Account Settings */}
      <div className="bg-[#18191c] border border-[#2d2e33] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-[#2d2e33]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-[#2BD45A]" size={20} />
            Cuenta
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de usuario</label>
              <input 
                type="text" 
                className="w-full bg-[#222327] border border-[#2d2e33] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2BD45A] transition-colors"
                placeholder="Tu nombre de usuario"
                defaultValue="Usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Correo electrónico</label>
              <input 
                type="email" 
                disabled
                className="w-full bg-[#222327]/50 border border-[#2d2e33] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                value="usuario@ejemplo.com"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-[#2d2e33]">
            <h3 className="text-sm font-bold text-white mb-4">Seguridad</h3>
            <button className="flex items-center justify-between w-full p-4 bg-[#222327] hover:bg-[#2d2e33] rounded-xl transition-colors border border-[#2d2e33] group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#18191c] rounded-lg text-gray-400 group-hover:text-white transition-colors">
                  <Lock size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-white">Cambiar contraseña</span>
                  <span className="text-xs text-gray-500">Actualiza tu clave de acceso</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#2BD45A]">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#18191c] border border-[#2d2e33] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-[#2d2e33]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="text-orange-500" size={20} />
            Notificaciones
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#222327] rounded-xl border border-[#2d2e33]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#18191c] rounded-lg text-gray-400">
                <Mail size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Correos electrónicos</span>
                <span className="text-xs text-gray-500">Recibe resúmenes semanales y alertas importantes</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifications.email} onChange={() => setNotifications(prev => ({...prev, email: !prev.email}))} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#2d2e33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2BD45A]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#222327] rounded-xl border border-[#2d2e33]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#18191c] rounded-lg text-gray-400">
                <Bell size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Notificaciones Push</span>
                <span className="text-xs text-gray-500">Alertas instantáneas en tu navegador</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifications.push} onChange={() => setNotifications(prev => ({...prev, push: !prev.push}))} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#2d2e33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2BD45A]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#18191c] border border-[#2d2e33] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-[#2d2e33]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="text-blue-500" size={20} />
            Preferencias
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#222327] rounded-xl border border-[#2d2e33]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#18191c] rounded-lg text-gray-400">
                <Moon size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Tema Oscuro</span>
                <span className="text-xs text-gray-500">Siempre activo en Promocupones</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2BD45A] px-3 py-1 bg-[#2BD45A]/10 rounded-full">Activo</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#222327] rounded-xl border border-[#2d2e33]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#18191c] rounded-lg text-gray-400">
                <Globe size={18} />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Idioma</span>
                <span className="text-xs text-gray-500">Selecciona tu idioma preferido</span>
              </div>
            </div>
            <select className="bg-[#18191c] text-white text-sm rounded-lg border border-[#2d2e33] focus:ring-[#2BD45A] focus:border-[#2BD45A] block p-2.5">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6">
        <button 
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all font-bold"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      <div className="text-center text-xs text-gray-600 pb-8">
        Promocupones v1.0.0 • Hecho con ❤️ por la comunidad
      </div>
    </div>
  )
}
