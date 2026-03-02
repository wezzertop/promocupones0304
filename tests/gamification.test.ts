import { calculateLevelProgress, getReferralLimit, calculateXpToNextLevel } from '../src/lib/gamification-utils'

describe('Gamification Utilities', () => {
  
  describe('calculateLevelProgress', () => {
    test('should return 0 when at floor', () => {
      expect(calculateLevelProgress(100, 100, 200)).toBe(0)
    })
    
    test('should return 50 when halfway', () => {
      expect(calculateLevelProgress(150, 100, 200)).toBe(50)
    })
    
    test('should return 100 when at ceiling', () => {
      expect(calculateLevelProgress(200, 100, 200)).toBe(100)
    })
    
    test('should clamp between 0 and 100', () => {
      expect(calculateLevelProgress(50, 100, 200)).toBe(0)
      expect(calculateLevelProgress(250, 100, 200)).toBe(100)
    })
  })

  describe('getReferralLimit', () => {
    test('should return 2 for levels 1-9', () => {
      expect(getReferralLimit(1)).toBe(2)
      expect(getReferralLimit(9)).toBe(2)
    })
    
    test('should return 5 for levels 10-19', () => {
      expect(getReferralLimit(10)).toBe(5)
      expect(getReferralLimit(19)).toBe(5)
    })
    
    test('should return 10 for levels 20-79', () => {
      expect(getReferralLimit(20)).toBe(10)
      expect(getReferralLimit(50)).toBe(10)
      expect(getReferralLimit(79)).toBe(10)
    })
    
    test('should return 20 for level 80+', () => {
      expect(getReferralLimit(80)).toBe(20)
      expect(getReferralLimit(100)).toBe(20)
    })
  })
  
  describe('calculateXpToNextLevel', () => {
    test('should calculate remaining XP correctly', () => {
      expect(calculateXpToNextLevel(150, 200)).toBe(50)
    })
    
    test('should return 0 if already passed', () => {
      expect(calculateXpToNextLevel(250, 200)).toBe(0)
    })
  })
})
