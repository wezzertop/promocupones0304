import { cn } from '@/lib/utils'

export default function DealCardSkeleton() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[50px_180px_1fr] bg-background rounded-[10px] overflow-hidden border border-white/5 h-auto animate-pulse w-full max-w-[calc(100%-1rem)] mx-auto md:max-w-none md:mx-0 mb-4 min-h-[140px] md:min-h-[200px]">
      
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between p-2.5 pb-2 border-b border-white/5 w-full bg-background">
        <div className="flex items-center gap-1.5">
           <div className="w-[16px] h-[16px] rounded-[10px] bg-white/5" />
           <div className="w-16 h-3 rounded-[4px] bg-white/5" />
        </div>
        <div className="flex gap-2">
           <div className="w-10 h-4 rounded-[6px] bg-white/5" />
           <div className="w-10 h-4 rounded-[6px] bg-white/5" />
        </div>
      </div>

      {/* Component A: Vertical Voting Sidebar */}
      <div className="hidden md:flex flex-col items-center justify-between gap-1 md:gap-2 w-full bg-background border-r border-white/5 py-3 md:py-4">
        <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-[10px] bg-white/5" />
        <div className="w-5 h-4 md:h-5 rounded-[4px] bg-white/5" />
        <div className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-[10px] bg-white/5" />
      </div>

      {/* MD Contents Wrapper */}
      <div className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] w-full md:contents p-2 md:p-0 gap-2 md:gap-0 h-full">

      {/* Component B: Image Area */}
      <div className="w-full flex flex-col items-center justify-start md:justify-center p-0 md:p-3 relative md:border-r border-white/5">
        <div className="relative w-full aspect-square bg-zinc-100 rounded-[10px] flex items-center justify-center shrink-0">
            <div className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] rounded-[10px] bg-zinc-300/30" />
        </div>
        <div className="flex md:hidden w-full h-[28px] mt-2 bg-white/5 rounded-[6px] shrink-0" />
      </div>

      {/* Component C: Info Body */}
      <div className="flex flex-col p-1 md:p-[20px] justify-between relative min-w-0 overflow-hidden h-full">
        <div className="flex flex-col gap-2 md:gap-3 w-full overflow-hidden">
            
            {/* Desktop Header Meta */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] rounded-[10px] bg-white/5" />
                <div className="w-16 md:w-24 h-3 md:h-4 rounded-[4px] bg-white/5" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                <div className="w-12 md:w-20 h-3 md:h-4 rounded-[4px] bg-white/5" />
              </div>
              <div className="flex gap-2">
                <div className="w-10 md:w-14 h-4 md:h-6 rounded-[6px] bg-white/5" />
                <div className="w-10 md:w-14 h-4 md:h-6 rounded-[6px] bg-white/5" />
              </div>
            </div>

            {/* Timer Mock */}
            <div className="w-24 md:w-32 h-3 md:h-4 mt-0.5 md:mt-1 rounded-[4px] bg-white/5" />

            {/* Title */}
            <div className="w-3/4 h-4 md:h-6 rounded-[4px] bg-white/5 mt-0.5" />

            {/* Description */}
            <div className="space-y-1.5 mt-0.5 md:mt-1">
                <div className="w-full h-2 md:h-3 rounded-[4px] bg-white/5" />
                <div className="w-5/6 h-2 md:h-3 rounded-[4px] bg-white/5" />
            </div>

        </div>

        {/* Footer */}
        <div className="flex mt-2 md:mt-4 items-end justify-between">
            <div className="flex gap-1.5 md:gap-2 items-end">
                <div className="w-20 md:w-28 h-6 md:h-8 rounded-[4px] bg-white/5" />
                <div className="w-10 md:w-14 h-3 md:h-4 rounded-[4px] bg-white/5 mb-1" />
                <div className="w-8 md:w-10 h-3 md:h-4 rounded-[10px] bg-white/5 mb-1" />
            </div>
            <div className="w-[80px] md:w-[120px] h-[28px] md:h-[36px] rounded-[10px] bg-white/10" />
        </div>
      </div>

      </div>
    </div>
  )
}
