
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, ThumbsUp, ThumbsDown, Loader2, Flag, Trash2, Reply } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const ENABLE_REPLIES = true

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  user: {
    username: string
    avatar_url: string | null
  }
  likes_count: number
  replies?: Comment[]
  user_vote?: 'like' | 'dislike' | null
}

interface CommentVote {
  user_id: string
  comment_id: string
  vote_type: 'like' | 'dislike'
}

interface CommentsSectionProps {
  dealId: string
}

export default function CommentsSection({ dealId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReasonType, setReportReasonType] = useState('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    fetchComments()
  }, [dealId])
  
  const fetchComments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUserId = session?.user?.id

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch user votes if logged in
      let userVotesMap = new Map<string, { type: 'like' | 'dislike', change_count: number }>()
      if (currentUserId) {
        const { data: votesData } = await supabase
          .from('comment_votes')
          .select('comment_id, vote_type, change_count')
          .eq('user_id', currentUserId)
        
        if (votesData) {
          votesData.forEach((v: any) => userVotesMap.set(v.comment_id, { type: v.vote_type, change_count: v.change_count || 0 }))
        }
      }

      // Organize comments into threads
      const threads: Comment[] = []
      const commentMap = new Map<string, Comment>()
      let count = 0

      // First pass: create map and add user_vote
      data?.forEach((raw: any) => {
        const voteInfo = userVotesMap.get(raw.id)
        const hydrated: Comment = {
          id: raw.id,
          content: raw.content,
          created_at: raw.created_at,
          user_id: raw.user_id,
          parent_id: raw.parent_id ?? null,
          user: raw.user || { username: 'Usuario', avatar_url: null },
          likes_count: raw.likes_count || 0,
          replies: [],
          user_vote: voteInfo?.type || null,
          // We attach this to the comment object so we can access it in handleVote
          // @ts-ignore - extending the interface dynamically for now
          vote_change_count: voteInfo?.change_count || 0
        }
        commentMap.set(hydrated.id, hydrated)
        count++
      })

      // Second pass: link parents and children
      data?.forEach((raw: any) => {
        const comment = commentMap.get(raw.id)
        if (!comment) return
        
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id)
          // If parent exists in fetched data, link it.
          if (parent) {
            parent.replies?.push(comment)
          } else {
            // Orphaned reply, treat as root
            threads.push(comment)
          }
        } else {
          threads.push(comment)
        }
      })

      setComments(threads)
      setTotalCount(count)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setLoading(false)
    }
  }

  const handleVote = async (commentId: string, voteType: 'like' | 'dislike') => {
    if (!session) {
      alert('Debes iniciar sesión para votar')
      return
    }

    // Find current comment to determine next state
    let currentComment: Comment | undefined
    const findComment = (list: Comment[]): Comment | undefined => {
      for (const c of list) {
        if (c.id === commentId) return c
        if (c.replies) {
          const found = findComment(c.replies)
          if (found) return found
        }
      }
      return undefined
    }

    currentComment = findComment(comments)
    if (!currentComment) return

    // Calculate new state
    let newVote: 'like' | 'dislike' | null = voteType
    let countDelta = 0
    // @ts-ignore
    const currentChangeCount = (currentComment as any).vote_change_count || 0
    let newChangeCount = currentChangeCount

    // Check if user is trying to change vote type (and not just toggle off)
    // Actually, user requirement: "cambiar el like por un dislike". This is a switch.
    // If they toggle off, is it a change? "deberiamos dejar al usario cambiar". Usually implies switching opinion.
    // Let's assume switching opinion counts as a change. Toggling off might not count or might count.
    // Let's be strict: any modification to an existing vote counts as a change if it's different.
    // However, if they just unlike (toggle off), maybe that's fine?
    // "cambiar el like por un dislike" -> Switch.
    // Let's track switches.
    
    const isSwitching = currentComment.user_vote && currentComment.user_vote !== voteType
    
    if (isSwitching) {
      if (currentChangeCount >= 1) {
        alert('Ya has cambiado tu voto una vez. No puedes cambiarlo de nuevo.')
        return
      }
      
      const confirmed = confirm('Solo puedes cambiar tu voto una vez. Si continúas, este cambio será definitivo. ¿Deseas proceder?')
      if (!confirmed) return
      
      newChangeCount = currentChangeCount + 1
    }

    if (voteType === 'like') {
      if (currentComment.user_vote === 'like') {
        // Toggle off like
        newVote = null
        countDelta = -1
      } else {
        // Was null or dislike, becoming like
        newVote = 'like'
        countDelta = 1
      }
    } else { // dislike
      if (currentComment.user_vote === 'dislike') {
        // Toggle off dislike
        newVote = null
      } else {
        // Was null or like, becoming dislike
        if (currentComment.user_vote === 'like') {
          countDelta = -1 // Remove the like count
        }
        newVote = 'dislike'
      }
    }

    // Optimistic Update
    const updateRecursive = (list: Comment[]): Comment[] => {
      return list.map(c => {
        if (c.id === commentId) {
          return { 
            ...c, 
            user_vote: newVote, 
            likes_count: Math.max(0, (c.likes_count || 0) + countDelta),
            // @ts-ignore
            vote_change_count: newChangeCount
          }
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateRecursive(c.replies) }
        }
        return c
      })
    }

    setComments(prev => updateRecursive(prev))

    // DB Operations
    try {
      if (newVote === null) {
        // Remove vote
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('comment_id', commentId)
        if (error) throw error
      } else {
        // Check if exists first to decide insert vs update (safer for RLS)
        // Or use upsert with explicit onConflict if supported, but simple check is robust.
        // Actually, since we have the change_count logic, we know if we are updating or inserting usually.
        // But let's rely on upsert which handles both.
        
        const { error } = await supabase
          .from('comment_votes')
          .upsert({
            user_id: session.user.id,
            comment_id: commentId,
            vote_type: newVote,
            change_count: newChangeCount
          }, { onConflict: 'user_id, comment_id' })
          
        if (error) throw error
      }

      // Update likes_count in comments table manually (since we don't have triggers set up yet)
      if (countDelta !== 0) {
        // Fetch current count first to be safe, or just atomic update if we had RPC.
        // For now, we'll just read-then-write which is susceptible to race conditions but acceptable for this MVP fix.
        const { data: current } = await supabase
          .from('comments')
          .select('likes_count')
          .eq('id', commentId)
          .single()
        
        if (current) {
          const currentCount = (current as any).likes_count
          await supabase
            .from('comments')
            .update({ likes_count: Math.max(0, (currentCount || 0) + countDelta) })
            .eq('id', commentId)
        }
      }

    } catch (error) {
      console.error('Error voting:', error)
      // Revert changes by fetching fresh data
      fetchComments()
      alert('Error al registrar el voto')
    }
  }

  const handleReport = async (commentId: string) => {
    if (!session) {
      alert('Debes iniciar sesión para denunciar')
      return
    }
    if (!reportDescription.trim()) {
      alert('Por favor describe el motivo de la denuncia')
      return
    }

    try {
      const { error } = await supabase.from('reports').insert({
        user_id: session.user.id,
        target_id: commentId,
        target_type: 'comment',
        reason: reportReasonType,
        description: reportDescription
      })

      if (error) throw error
      alert('Denuncia enviada correctamente. Gracias por ayudarnos a mantener la comunidad segura.')
      setReportingId(null)
      setReportDescription('')
      setReportReasonType('spam')
    } catch (error) {
      console.error('Error reporting:', error)
      alert('Error al enviar la denuncia')
    }
  }

  const handleSubmit = async (parentId: string | null = null) => {
    if (!session) {
      alert('Debes iniciar sesión para comentar')
      return
    }

    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const payload: { deal_id: string; user_id: string; content: string } & { parent_id?: string } = {
        deal_id: dealId,
        user_id: session.user.id,
        content: newComment
      }

      if (parentId) {
        payload.parent_id = parentId
      }

      const { data: insertedRaw, error } = await supabase
        .from('comments')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error

      const inserted: any = insertedRaw
      if (inserted) {
        const optimistic: Comment = {
          id: inserted.id,
          content: inserted.content,
          created_at: inserted.created_at || new Date().toISOString(),
          user_id: inserted.user_id,
          parent_id: inserted.parent_id ?? null,
          user: {
            username: session.user.user_metadata?.username || 'Tú',
            avatar_url: session.user.user_metadata?.avatar_url || null
          },
          likes_count: 0,
          replies: [],
          user_vote: null
        }
        setComments(prev => (optimistic.parent_id ? prev : [...prev, optimistic]))
      }

      setNewComment('')
      setReplyTo(null)
      // Refrescar desde servidor en background para mantener consistencia
      fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      // @ts-ignore
      const code = (error as any)?.code
      if (code === '42501') {
        setErrorMsg('No tienes permisos para comentar. Inicia sesión y verifica permisos de la tabla comments (RLS).')
      } else {
        setErrorMsg('Error al publicar el comentario. Intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={cn("flex gap-2.5", isReply ? "mt-3 ml-6 border-l-2 border-white/5 pl-3" : "mt-4")}>
      <div className="flex-shrink-0">
        {comment.user?.avatar_url ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative">
            <Image 
              src={comment.user.avatar_url} 
              alt={comment.user.username} 
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold border border-white/5">
            {(comment.user?.username || 'U').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-zinc-200">{comment.user?.username || 'Usuario'}</span>
            <span className="text-[10px] text-zinc-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>

        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <button 
            onClick={() => handleVote(comment.id, 'like')}
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium transition-colors",
              comment.user_vote === 'like' ? "text-[#2BD45A]" : "text-zinc-500 hover:text-white"
            )}
          >
            <ThumbsUp size={12} className={comment.user_vote === 'like' ? "fill-current" : ""} />
            <span>{comment.likes_count || 0}</span>
          </button>
          
          <button 
            onClick={() => handleVote(comment.id, 'dislike')}
            className={cn(
              "flex items-center gap-1 text-[10px] font-medium transition-colors",
              comment.user_vote === 'dislike' ? "text-red-500" : "text-zinc-500 hover:text-white"
            )}
          >
            <ThumbsDown size={12} className={comment.user_vote === 'dislike' ? "fill-current" : ""} />
          </button>

          <button 
            onClick={() => {
              setReplyTo(replyTo === comment.id ? null : comment.id)
              // Optionally scroll to main input or focus it
              if (replyTo !== comment.id) {
                // Focus main input logic could go here, or we use a per-comment input.
                // Current implementation uses ONE main input for everything.
                // Let's scroll to the main input to make it clear.
                const mainInput = document.querySelector('textarea');
                if (mainInput) (mainInput as HTMLTextAreaElement).focus();
              }
            }}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-[#2BD45A] transition-colors"
          >
            <Reply size={12} />
            Responder
          </button>

          <div className="ml-auto relative">
            <button 
              onClick={() => setReportingId(reportingId === comment.id ? null : comment.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors" 
              title="Reportar"
            >
              <Flag size={12} />
            </button>
            
            {reportingId === comment.id && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#18181b] border border-white/10 rounded-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Flag size={14} className="text-red-400" />
                  Reportar comentario
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Motivo</label>
                    <select
                      value={reportReasonType}
                      onChange={(e) => setReportReasonType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                      <option value="spam">Spam o publicidad no deseada</option>
                      <option value="offensive">Contenido ofensivo o inapropiado</option>
                      <option value="harassment">Acoso o intimidación</option>
                      <option value="misinformation">Información falsa</option>
                      <option value="other">Otro motivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Descripción</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe brevemente el problema..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500/50 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setReportingId(null)
                      setReportDescription('')
                      setReportReasonType('spam')
                    }}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleReport(comment.id)}
                    disabled={!reportDescription.trim()}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                  >
                    Enviar Reporte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nested replies rendered here */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="" id="comments">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <MessageSquare className="text-[#2BD45A] w-4 h-4" />
          Comentarios ({totalCount})
        </h3>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {errorMsg}
          <button
            className="ml-3 underline hover:text-red-300"
            onClick={() => {
              setLoading(true)
              fetchComments()
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Main Comment Input */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
        {!session ? (
          <div className="text-center py-4">
            <p className="text-zinc-400 text-sm mb-3">Inicia sesión para unirte a la conversación</p>
            <Link 
              href="/auth/login" 
              className="inline-block px-4 py-2 bg-[#2BD45A] text-black text-sm font-bold rounded-lg hover:bg-[#25b84e] transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="shrink-0 hidden sm:block">
              {/* Current User Avatar Placeholder */}
              <div className="w-10 h-10 rounded-full bg-[#2BD45A]/10 flex items-center justify-center text-[#2BD45A] font-bold">
                Me
              </div>
            </div>
            <div className="flex-1">
              {replyTo && (
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 bg-white/5 p-2 rounded-lg border border-white/5">
                  <span>Respondiendo comentario...</span>
                  <button 
                    onClick={() => {
                      setReplyTo(null)
                      setNewComment('')
                    }}
                    className="text-white hover:text-red-400"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "Escribe tu respuesta..." : "¿Qué opinas de esta oferta?"}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2BD45A]/50 focus:ring-1 focus:ring-[#2BD45A]/50 transition-all resize-none text-sm"
                autoFocus={!!replyTo}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleSubmit(replyTo)}
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-2 bg-[#2BD45A] text-black font-bold rounded-lg text-sm hover:bg-[#25b84e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar comentario'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#2BD45A] animate-spin" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No hay comentarios aún</p>
          <p className="text-sm text-zinc-600 mt-1">Sé el primero en compartir tu opinión</p>
        </div>
      )}
    </div>
  )
}
