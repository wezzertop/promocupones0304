
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Deal } from '@/types'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Edit, 
  Tag, 
  ArrowLeft 
} from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function MyDealsPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .returns<Deal[]>()

  if (error) {
    console.error('Error fetching user deals:', error)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
            <CheckCircle size={14} />
            Activa
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
            <Clock size={14} />
            Pendiente
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
            <XCircle size={14} />
            Rechazada
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-xs font-bold border border-zinc-500/20">
            <Clock size={14} />
            Expirada
          </span>
        )
      case 'revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">
            <Edit size={14} />
            En Revisión
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-xs font-bold border border-zinc-500/20">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            href="/perfil" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Volver al perfil
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Publicaciones</h1>
          <p className="text-zinc-400">Gestiona y revisa el estado de tus ofertas</p>
        </div>
        <Link 
          href="/publicar" 
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-all shadow-lg shadow-[#2BD45A]/20"
        >
          <Tag size={18} />
          Nueva Oferta
        </Link>
      </div>

      {/* List */}
      <div className="space-y-4">
        {deals && deals.length > 0 ? (
          deals.map((deal) => (
            <div 
              key={deal.id} 
              className="bg-[#18191c] border border-[#2d2e33] rounded-2xl overflow-hidden hover:border-[#2BD45A]/30 transition-all group"
            >
              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-48 h-32 md:h-32 bg-white rounded-xl overflow-hidden relative shrink-0">
                  {deal.image_urls?.[0] ? (
                    <Image
                      src={deal.image_urls[0]}
                      alt={deal.title}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                      <Tag size={32} />
                    </div>
                  )}
                  {/* Overlay for status on mobile image */}
                  <div className="absolute top-2 left-2 md:hidden">
                    {getStatusBadge(deal.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-white truncate pr-4">
                      {deal.title}
                    </h3>
                    <div className="hidden md:block shrink-0">
                      {getStatusBadge(deal.status)}
                    </div>
                  </div>

                  <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                    {deal.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale: es })}
                    </span>
                    
                    {deal.deal_price && (
                      <span className="text-[#2BD45A] font-bold">
                        ${deal.deal_price}
                      </span>
                    )}
                  </div>

                  {/* Moderation Feedback */}
                  {deal.status === 'rejected' && deal.moderation_notes && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-500">Razón del rechazo:</p>
                          <p className="text-sm text-red-400 mt-1">{deal.moderation_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                   {/* Pending Feedback */}
                   {deal.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                      <p className="text-xs text-yellow-500/80">
                        Esta oferta está siendo revisada por nuestro equipo. No es visible públicamente aún.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#2d2e33] pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                  <Link
                    href={`/oferta/${deal.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#222327] hover:bg-[#2d2e33] text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={16} />
                    Ver
                  </Link>
                  {/* 
                  <Link
                    href={`/oferta/${deal.id}/editar`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#222327] hover:bg-[#2d2e33] text-white text-sm font-medium transition-colors"
                  >
                    <Edit size={16} />
                    Editar
                  </Link>
                  */}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-[#18191c] rounded-3xl border border-[#2d2e33] border-dashed">
            <div className="w-16 h-16 bg-[#222327] rounded-full flex items-center justify-center mb-4 text-gray-500">
              <Tag size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tienes publicaciones</h3>
            <p className="text-gray-400 max-w-md mb-6">
              ¡Empieza a compartir ofertas con la comunidad!
            </p>
            <Link 
              href="/publicar"
              className="px-6 py-3 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-xl transition-colors shadow-lg shadow-[#2BD45A]/20"
            >
              Publicar Oferta
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
