'use client'

import { useState } from 'react'
import { Loader2, Trash, Plus, Save } from 'lucide-react'
import { addReferralPattern, deleteReferralPattern, addForbiddenWord, deleteForbiddenWord } from './actions'

interface ReferralPattern {
  id: string
  pattern: string
  description: string
  is_active: boolean
}

interface ForbiddenWord {
  id: string
  word: string
  created_at: string
}

interface SettingsClientProps {
  initialPatterns: ReferralPattern[]
  initialForbiddenWords: ForbiddenWord[]
}

export default function SettingsClient({ initialPatterns, initialForbiddenWords }: SettingsClientProps) {
  const [newPattern, setNewPattern] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newWord, setNewWord] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddPattern = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPattern) return
    setLoading(true)

    try {
      await addReferralPattern(newPattern, newDescription)
      setNewPattern('')
      setNewDescription('')
    } catch (error) {
      alert('Error al agregar patrón: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePattern = async (id: string) => {
    if (!confirm('¿Eliminar este patrón?')) return

    try {
      await deleteReferralPattern(id)
    } catch (error) {
      alert('Error al eliminar patrón: ' + (error as Error).message)
    }
  }

  const handleAddForbiddenWord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWord) return
    setLoading(true)

    try {
      await addForbiddenWord(newWord)
      setNewWord('')
    } catch (error) {
      alert('Error al agregar palabra: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteForbiddenWord = async (id: string) => {
    if (!confirm('¿Eliminar esta palabra?')) return

    try {
      await deleteForbiddenWord(id)
    } catch (error) {
      alert('Error al eliminar palabra: ' + (error as Error).message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
        <p className="text-zinc-400">Gestiona las reglas de moderación automática</p>
      </div>

      {/* Referral Patterns */}
      <div className="bg-[#18191c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Patrones de Referidos Bloqueados</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Agrega fragmentos de URL que identifiquen enlaces de afiliados no permitidos (ej: "ref=", "amazon.to").
        </p>

        <form onSubmit={handleAddPattern} className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Patrón (ej: ref=)"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            className="flex-1 bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="flex-1 bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={loading}
          />
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar
          </button>
        </form>

        <div className="space-y-2">
          {initialPatterns.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">No hay patrones configurados.</p>
          ) : (
            initialPatterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div>
                  <code className="text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{pattern.pattern}</code>
                  {pattern.description && (
                    <span className="text-zinc-500 text-sm ml-3">{pattern.description}</span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeletePattern(pattern.id)}
                  className="text-zinc-500 hover:text-red-500 transition-colors p-2"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Forbidden Words */}
      <div className="bg-[#18191c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Filtro de Palabras Prohibidas</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Define palabras que bloquearán automáticamente la publicación de ofertas o comentarios.
        </p>

        <form onSubmit={handleAddForbiddenWord} className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Palabra prohibida"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            className="flex-1 bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
            disabled={loading}
          />
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {initialForbiddenWords.length === 0 ? (
            <p className="text-zinc-500 w-full text-center py-4">No hay palabras configuradas.</p>
          ) : (
            initialForbiddenWords.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg group">
                <span className="text-red-400 font-medium">{item.word}</span>
                <button 
                  onClick={() => handleDeleteForbiddenWord(item.id)}
                  className="text-red-400/50 hover:text-red-400 transition-colors"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}