'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function FloatingActionButton() {
  return (
    <Link
      href="/publicar"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 bg-[#2BD45A] hover:bg-[#25b84e] text-black font-bold rounded-full shadow-[0_0_15px_rgba(43,212,90,0.3)] hover:shadow-[0_0_20px_rgba(43,212,90,0.5)] transition-all transform hover:scale-105"
    >
      <Plus size={20} className="font-bold" />
      <span>Publicar</span>
    </Link>
  )
}
