'use client'

import { useState } from 'react'
import { Bell, Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { sendNotification } from './actions'

export default function NotificationsClient() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')

    try {
      if (!targetUser) {
        throw new Error('Debes especificar un usuario (ID, Email o Username).')
      }

      await sendNotification(targetUser, title, message)

      setSuccess('Notificación enviada exitosamente.')
      setTitle('')
      setMessage('')
      setTargetUser('')
    } catch (err: any) {
      setError(err.message || 'Error al enviar notificación')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Enviar Notificaciones</h1>
        <p className="text-zinc-400">Envía alertas importantes a usuarios específicos</p>
      </div>

      <div className="bg-[#18191c] border border-white/5 rounded-2xl p-8">
        <form onSubmit={handleSend} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Destinatario (ID, Email o Username)
            </label>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Ej: usuario123"
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">
              Nota: Por seguridad, actualmente solo se permiten notificaciones individuales.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mantenimiento programado"
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Escribe el contenido de la notificación..."
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <button 
            type="submit"
            disabled={sending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Send className="w-5 h-5" /> Enviar Notificación
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}