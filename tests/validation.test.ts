import { describe, expect, it } from 'vitest'
import { normalizeIban, validateEdrpou, validateIban, validatePasswordStrength } from '@/utils/validation'

const VALID_IBAN = 'UA743052990000026007233566001'

describe('validateIban', () => {
  it('приймає коректний IBAN (також з пробілами та малими літерами)', () => {
    expect(validateIban(VALID_IBAN).valid).toBe(true)
    expect(validateIban('ua74 3052 9900 0002 6007 2335 6600 1').valid).toBe(true)
  })
  it('відхиляє невірну контрольну суму', () => {
    expect(validateIban('UA753052990000026007233566001')).toEqual({ valid: false, error: 'Невірна контрольна сума IBAN' })
  })
  it('відхиляє неправильну довжину, країну та символи', () => {
    expect(validateIban('UA74305299').valid).toBe(false)
    expect(validateIban('DE89370400440532013000').valid).toBe(false)
    expect(validateIban('UA74305299000002600723356600A').valid).toBe(false)
    expect(validateIban('').valid).toBe(false)
  })
  it('normalizeIban', () => {
    expect(normalizeIban(' ua74 3052 ')).toBe('UA743052')
  })
})

describe('validateEdrpou', () => {
  it('8 або 10 цифр', () => {
    expect(validateEdrpou('12345678').valid).toBe(true)
    expect(validateEdrpou('1234567890').valid).toBe(true)
    expect(validateEdrpou('123456789').valid).toBe(false)
    expect(validateEdrpou('1234567a').valid).toBe(false)
  })
})

describe('validatePasswordStrength', () => {
  it('вимагає довжину, регістр і цифри', () => {
    expect(validatePasswordStrength('Short1').valid).toBe(false)
    expect(validatePasswordStrength('alllowercase123').valid).toBe(false)
    expect(validatePasswordStrength('NoDigitsHereAtAll').valid).toBe(false)
    expect(validatePasswordStrength('GoodPassword123').valid).toBe(true)
  })
})
