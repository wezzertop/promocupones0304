'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
    </div>
  ),
})

export default Map
