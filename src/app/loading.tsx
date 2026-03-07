import DealCardSkeleton from "@/components/skeletons/DealCardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Featured Banner Skeleton */}
      <div className="w-full h-[200px] md:h-[300px] rounded-3xl bg-zinc-900 animate-pulse border border-white/5" />

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            <div className="w-20 h-10 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="w-20 h-10 rounded-xl bg-zinc-900 animate-pulse" />
            <div className="w-20 h-10 rounded-xl bg-zinc-900 animate-pulse" />
        </div>
        <div className="w-full sm:w-48 h-10 rounded-xl bg-zinc-900 animate-pulse" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
