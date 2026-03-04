import { describe, expect, test } from 'vitest' // Or just global describe/test if using Jest/Vitest setup
import { contactSchema, reportSchema, profileSchema } from '../src/lib/schemas'

describe('Validation Schemas', () => {
  
  describe('Contact Schema', () => {
    test('should validate correct contact form', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a valid message with enough characters.'
      }
      const result = contactSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should reject short message', () => {
      const invalidData = {
        name: 'John',
        email: 'john@example.com',
        message: 'Short'
      }
      const result = contactSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message).toBeDefined()
      }
    })

    test('should reject invalid email', () => {
      const invalidData = {
        name: 'John',
        email: 'not-an-email',
        message: 'Valid message body here.'
      }
      const result = contactSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Report Schema', () => {
    test('should validate correct report', () => {
      const validData = {
        target_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        target_type: 'deal',
        reason: 'spam',
        description: 'This looks like spam.'
      }
      const result = reportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should reject invalid UUID', () => {
      const invalidData = {
        target_id: 'invalid-uuid',
        target_type: 'deal',
        reason: 'spam'
      }
      const result = reportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject empty reason', () => {
      const invalidData = {
        target_id: '123e4567-e89b-12d3-a456-426614174000',
        target_type: 'deal',
        reason: ''
      }
      const result = reportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Profile Schema', () => {
    test('should validate correct profile', () => {
      const validData = {
        username: 'valid_user_123',
        avatar_url: 'https://example.com/avatar.jpg'
      }
      const result = profileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('should reject username with special characters', () => {
      const invalidData = {
        username: 'user@name!',
      }
      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('should reject short username', () => {
      const invalidData = {
        username: 'ab',
      }
      const result = profileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
