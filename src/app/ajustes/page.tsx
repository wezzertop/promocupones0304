'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, User, Lock, Mail, Moon, Globe, LogOut, Save, Shield, Camera, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { processAvatar } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Form states
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  })

  useEffect(() => {
    async function getProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (data) {
        setProfile(data)
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url)
      }
      
      setLoading(false)
    }
    
    getProfile()
  }, [supabase, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    
    const file = e.target.files[0]
    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    
    try {
      let publicAvatarUrl = profile?.avatar_url
      
      // Upload new avatar if selected
      if (avatarFile) {
        const processedAvatar = await processAvatar(avatarFile)
        const fileExt = 'webp' // processed avatar is always webp
        const fileName = `${user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `avatars/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('deals') 
          .upload(filePath, processedAvatar, {
             contentType: 'image/webp',
             upsert: true
          })
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('deals')
          .getPublicUrl(filePath)
          
        publicAvatarUrl = publicUrl
      }
      
      // Update profile in DB
      const { error } = await supabase
        .from('users')
        .update({
          username,
          avatar_url: publicAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        
      if (error) throw error

      // Update Auth Metadata (Important for Header/Sidebar to reflect changes immediately)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username,
          avatar_url: publicAvatarUrl
        }
      })

      if (authError) {
        console.error('Error updating auth metadata:', authError)
        // Non-blocking, but good to know
      }
      
      alert('Perfil actualizado correctamente')
      router.refresh()
      
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert('Error al actualizar el perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2BD45A]"></div>
      </div>
    )
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
          disabled={saving}
          className="px-6 py-2.5 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : (
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
        
        <div className="p-6 space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center sm:flex-row gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#222327] bg-[#222327] relative shadow-xl shadow-black/50">
                        {avatarUrl ? (
                            <Image 
                                src={avatarUrl} 
                                alt="Avatar" 
                                fill 
                                sizes="96px"
                                unoptimized
                                className="object-cover rounded-full group-hover:opacity-75 transition-opacity"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <User size={40} />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#2BD45A] text-black p-1.5 rounded-full border-4 border-[#18191c]">
                        <Upload size={14} />
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                </div>
                
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white mb-1">Foto de Perfil</h3>
                    <p className="text-sm text-gray-400 mb-3">
                        Sube una imagen para personalizar tu perfil. <br/>
                        Se recomienda 400x400px.
                    </p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-bold text-[#2BD45A] hover:text-[#25b84e] transition-colors"
                    >
                        Cambiar imagen
                    </button>
                </div>
            </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-[#2d2e33]">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de usuario</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#222327] border border-[#2d2e33] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#2BD45A] transition-colors"
                placeholder="Tu nombre de usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Correo electrónico</label>
              <input 
                type="email" 
                disabled
                className="w-full bg-[#222327]/50 border border-[#2d2e33] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                value={user?.email || ''}
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

          <div className="pt-4 border-t border-[#2d2e33] flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
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
