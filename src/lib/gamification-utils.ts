import { GamificationLevel } from '@/types'

export function calculateLevelProgress(currentXp: number, levelXpRequired: number, nextLevelXp: number): number {
  const floor = levelXpRequired
  const ceiling = nextLevelXp
  
  if (ceiling <= floor) return 100 // Should not happen if levels are correct
  
  const progress = ((currentXp - floor) / (ceiling - floor)) * 100
  return Math.min(100, Math.max(0, progress))
}

export function getReferralLimit(level: number): number {
  if (level >= 80) return 20
  if (level >= 20) return 10
  if (level >= 10) return 2
  return 0
}

export function calculateXpToNextLevel(currentXp: number, nextLevelXp: number): number {
  return Math.max(0, nextLevelXp - currentXp)
}
