import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertsClient from './AlertsClient'
import { BellRing, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: alerts, error } = await supabase
    .from('deal_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/perfil" className="p-2 hover:bg-surface-hover rounded-full text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <BellRing className="text-[#07B5A7]" />
            Mis Alertas
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Administra las alertas de ofertas que te interesan.
          </p>
        </div>
      </div>

      <AlertsClient initialAlerts={alerts || []} userId={user.id} />
    </div>
  )
}
