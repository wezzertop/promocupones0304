import { cn } from '@/lib/utils'

export default function DealCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row bg-[#09090b] rounded-xl md:rounded-3xl overflow-hidden border border-white/5 h-auto md:h-[340px] animate-pulse">
      
      {/* Vertical Voting Sidebar (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center justify-center gap-4 w-16 bg-black/40 border-r border-white/5 py-4 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-zinc-800" />
        <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-zinc-800" />
            <div className="w-6 h-4 rounded bg-zinc-800" />
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-800" />
      </div>

      {/* Image Section */}
      <div className="flex flex-col w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-white/5">
        <div className="w-full h-[200px] md:h-full relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 md:p-6 justify-between relative">
        
        {/* Header Meta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800" />
            <div className="w-24 h-4 rounded bg-zinc-800" />
          </div>
          <div className="w-20 h-5 rounded bg-zinc-800" />
        </div>

        {/* Title */}
        <div className="mb-4 space-y-2">
            <div className="w-3/4 h-6 md:h-7 rounded bg-zinc-800" />
            <div className="w-1/2 h-6 md:h-7 rounded bg-zinc-800" />
        </div>

        {/* Price & Store */}
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-baseline gap-2">
                <div className="w-32 h-8 rounded bg-zinc-800" />
                <div className="w-16 h-4 rounded bg-zinc-800" />
            </div>
            <div className="flex gap-2">
                <div className="w-20 h-4 rounded bg-zinc-800" />
                <div className="w-20 h-4 rounded bg-zinc-800" />
                <div className="w-20 h-4 rounded bg-zinc-800" />
            </div>
        </div>

        {/* Description (Desktop only) */}
        <div className="hidden md:block mb-4 space-y-2">
            <div className="w-full h-4 rounded bg-zinc-800" />
            <div className="w-5/6 h-4 rounded bg-zinc-800" />
        </div>

        {/* Footer Actions */}
        <div className="flex mt-auto items-center justify-between pt-3 border-t border-white/5">
            <div className="flex gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
            </div>
            <div className="w-32 h-12 rounded-xl bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
