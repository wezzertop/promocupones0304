'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, TrendingUp, Award } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let channel: any

    const setupNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetchNotifications(session.user.id)

      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()
    }

    setupNotifications()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n: any) => !n.is_read).length)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f1012]"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#18191c] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-[#2BD45A] hover:underline"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  No tienes notificaciones
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      onClick={() => {
                        if (notification.link && notification.link !== '#') {
                            setIsOpen(false)
                            // Mark as read when clicking the notification
                            if (!notification.is_read) {
                                markAsRead(notification.id)
                            }
                            // Navigate manually if needed, or rely on Link wrapping
                        }
                      }}
                      className={`p-4 hover:bg-white/5 transition-colors relative cursor-pointer group ${!notification.is_read ? 'bg-white/[0.05]' : ''}`}
                    >
                      {/* Link wrapper for the whole card if link exists */}
                      {notification.link && notification.link !== '#' && (
                        <Link href={notification.link} className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />
                      )}

                      <div className="flex gap-3 relative z-10 pointer-events-none">
                        <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === 'post_approved' ? 'bg-[#2BD45A]/10 text-[#2BD45A]' : 
                          notification.type === 'post_rejected' ? 'bg-red-500/10 text-red-500' :
                          notification.type === 'comment_reply' || notification.type === 'new_comment' ? 'bg-blue-500/10 text-blue-500' :
                          notification.type === 'level_up' || notification.type === 'badge_earned' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {notification.type === 'post_approved' ? <CheckCircle size={16} /> : 
                           notification.type === 'post_rejected' ? <X size={16} /> :
                           notification.type === 'comment_reply' || notification.type === 'new_comment' ? <MessageSquare size={16} /> :
                           notification.type === 'level_up' ? <TrendingUp size={16} /> :
                           notification.type === 'badge_earned' ? <Award size={16} /> :
                           <AlertCircle size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-0.5">
                            {notification.title}
                          </p>
                          <p className="text-xs text-zinc-400 mb-2 break-words line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-600">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation() // Prevent navigation
                              e.preventDefault() // Prevent navigation
                              markAsRead(notification.id)
                            }}
                            className="absolute top-0 right-0 p-2 text-blue-500 hover:text-blue-400 pointer-events-auto transition-transform hover:scale-110"
                            title="Marcar como leído"
                          >
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
