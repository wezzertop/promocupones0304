'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountdownProps {
  targetDate: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Countdown({ targetDate, className, size = 'sm' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date()
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      }
      setIsExpired(true)
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (isExpired) {
    return null
  }

  const sizeClasses = {
    sm: {
      container: "py-1 px-2 gap-2 text-[10px] md:text-xs",
      label: "text-[8px]",
      number: "text-xs md:text-sm",
      icon: "w-3 h-3"
    },
    md: {
      container: "py-2 px-4 gap-3 text-xs md:text-sm",
      label: "text-[10px]",
      number: "text-sm md:text-base",
      icon: "w-4 h-4"
    },
    lg: {
      container: "py-3 px-6 gap-4 text-sm md:text-base",
      label: "text-xs",
      number: "text-xl md:text-2xl",
      icon: "w-5 h-5"
    }
  }

  const s = sizeClasses[size]

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-md border-t border-[#2BD45A]/30 flex items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
      s.container,
      className
    )}>
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[#2BD45A] animate-pulse">
        <Clock className={s.icon} />
        <span className="hidden sm:inline">Termina en:</span>
      </div>
      
      <div className="flex gap-2 font-black font-mono text-white items-center">
        <TimeUnit value={timeLeft.days} label="DÍAS" size={size} />
        <span className="text-zinc-500 pb-2">:</span>
        <TimeUnit value={timeLeft.hours} label="HRS" size={size} />
        <span className="text-zinc-500 pb-2">:</span>
        <TimeUnit value={timeLeft.minutes} label="MIN" size={size} />
        <span className="text-zinc-500 pb-2">:</span>
        <TimeUnit value={timeLeft.seconds} label="SEG" size={size} isLast />
      </div>
    </div>
  )
}

function TimeUnit({ value, label, size, isLast }: { value: number, label: string, size: 'sm' | 'md' | 'lg', isLast?: boolean }) {
  const sizeClasses = {
    sm: { number: "text-xs md:text-sm", label: "text-[6px] md:text-[8px]" },
    md: { number: "text-base md:text-lg", label: "text-[8px] md:text-[10px]" },
    lg: { number: "text-xl md:text-2xl", label: "text-[10px] md:text-xs" }
  }
  
  return (
    <div className="flex flex-col items-center leading-none min-w-[2ch]">
      <span className={cn("text-white tabular-nums tracking-tight", sizeClasses[size].number)}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className={cn("font-medium text-zinc-400 mt-0.5", sizeClasses[size].label)}>
        {label}
      </span>
    </div>
  )
}
