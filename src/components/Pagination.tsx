'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PaginationProps {
  totalPages: number
  currentPage: number
  baseUrl?: string
}

export default function Pagination({ totalPages, currentPage, baseUrl }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `${baseUrl || pathname}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis-start')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <nav className="flex items-center justify-center gap-1 md:gap-2 mt-12 mb-8" aria-label="Paginación">
      {/* Previous Button */}
      <Link
        href={createPageUrl(Math.max(1, currentPage - 1))}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl border border-[#2d2e33] bg-[#18191c] text-gray-400 transition-all hover:text-white hover:border-[#2BD45A]/50 hover:bg-[#2BD45A]/5",
          currentPage === 1 && "pointer-events-none opacity-30"
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft size={20} />
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 md:gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <div key={`ellipsis-${index}`} className="w-8 h-10 flex items-center justify-center text-gray-600">
                <MoreHorizontal size={16} />
              </div>
            )
          }

          const pageNum = page as number
          const isActive = currentPage === pageNum

          return (
            <Link
              key={pageNum}
              href={createPageUrl(pageNum)}
              className={cn(
                "flex items-center justify-center min-w-[40px] h-10 px-3 rounded-xl border text-sm font-bold transition-all",
                isActive
                  ? "bg-[#2BD45A] border-[#2BD45A] text-black shadow-lg shadow-[#2BD45A]/20"
                  : "bg-[#18191c] border-[#2d2e33] text-gray-400 hover:text-white hover:border-[#2BD45A]/50 hover:bg-[#2BD45A]/5"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      {/* Next Button */}
      <Link
        href={createPageUrl(Math.min(totalPages, currentPage + 1))}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl border border-[#2d2e33] bg-[#18191c] text-gray-400 transition-all hover:text-white hover:border-[#2BD45A]/50 hover:bg-[#2BD45A]/5",
          currentPage === totalPages && "pointer-events-none opacity-30"
        )}
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight size={20} />
      </Link>
    </nav>
  )
}
