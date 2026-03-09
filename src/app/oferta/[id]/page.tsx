'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, use } from 'react'
import { useUIStore } from '@/lib/store'
import { toggleDealStatus } from '../actions'
import DealDetailView from '@/components/DealDetailView'
import FeedAd from '@/components/FeedAd'

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { setHeaderVisible } = useUIStore()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Voting state
  const [votes, setVotes] = useState(0)
  const [userVote, setUserVote] = useState<'hot' | 'cold' | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  
  // Pause/Resume state
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleStatus = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
        const result = await toggleDealStatus(id)
        if (result.error) {
            alert(result.error)
        } else if (result.newStatus) {
            // Update local state
            setDeal((prev: any) => ({ ...prev, status: result.newStatus }))
        }
    } catch (e) {
        console.error(e)
        alert('Error al cambiar estado')
    } finally {
        setIsToggling(false)
    }
  }
  
  useEffect(() => {
    // Force header visible on mount
    setHeaderVisible(true)
  }, [setHeaderVisible])

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUserId(session.user.id)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    async function fetchDeal() {
      const supabase = createClient()
      const { data: dealData, error } = await (supabase.from('deals') as any)
        .select(`
          *,
          user:users!deals_user_id_fkey(id, username, avatar_url),
          category:categories(name),
          store:stores(name, slug, logo_url),
          comments(count)
        `)
        .eq('id', id)
        .single()

      if (error || !dealData) {
        console.error('Error fetching deal:', error)
        // Handle error or not found
      } else {
        setDeal({
          ...(dealData as any),
          comments_count: (dealData as any).comments?.[0]?.count || 0
        })
        setVotes((dealData as any).votes_count || 0)
      }
      setLoading(false)
    }
    fetchDeal()
  }, [id])

  // Fetch user vote
  useEffect(() => {
    async function fetchUserVote() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: voteData } = await (supabase.from('votes') as any)
          .select('vote_type')
          .eq('deal_id', id)
          .eq('user_id', session.user.id)
          .single()
          
        if (voteData) {
          setUserVote((voteData as any).vote_type as 'hot' | 'cold')
        }
      }
    }
    fetchUserVote()
  }, [id])

  const handleVote = async (type: 'hot' | 'cold') => {
    if (isVoting) return
    setIsVoting(true)

    const supabase = createClient()

    // Store previous state for rollback
    const previousVote = userVote
    const previousCount = votes

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Inicia sesión para votar')
        setIsVoting(false)
        return
      }

      let newVote: 'hot' | 'cold' | null = type
      let newCount = votes
      let shouldDelete = false

      if (userVote === type) {
        // Toggle off
        newVote = null
        newCount = type === 'hot' ? votes - 1 : votes + 1
        shouldDelete = true
      } else {
        // New vote or change vote
        if (userVote === null) {
          newCount = type === 'hot' ? votes + 1 : votes - 1
        } else if (userVote === 'hot' && type === 'cold') {
          newCount = votes - 2
        } else if (userVote === 'cold' && type === 'hot') {
          newCount = votes + 2
        }
      }

      setVotes(newCount)
      setUserVote(newVote)

      if (shouldDelete) {
         const { error } = await (supabase.from('votes') as any)
          .delete()
          .eq('user_id', session.user.id)
          .eq('deal_id', id)
         
         if (error) throw error
      } else {
         const { error } = await (supabase.from('votes') as any)
          .upsert({
            user_id: session.user.id,
            deal_id: id,
            vote_type: type
          }, { onConflict: 'user_id, deal_id' })

         if (error) throw error
      }

    } catch (error) {
      console.error('Error al votar:', error)
      alert('Error al registrar el voto')
      // Revert optimistic update
      setVotes(previousCount)
      setUserVote(previousVote)
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando oferta...</div>
  }

  if (!deal) {
    return <div className="p-8 text-center text-zinc-500">Oferta no encontrada</div>
  }

  return (
    <>
      <DealDetailView 
        deal={deal}
        currentUserId={currentUserId}
        userVote={userVote}
        votes={votes}
        onVote={handleVote}
        onToggleStatus={handleToggleStatus}
        isToggling={isToggling}
      />
    </>
  )
}
