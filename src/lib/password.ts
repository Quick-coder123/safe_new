import 'server-only'
import { randomInt } from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const SYMBOLS = '!@#$%*?'

/** Криптографічно стійкий тимчасовий пароль. */
export function generateTempPassword(length = 14): string {
  let result = ''
  for (let i = 0; i < length - 1; i++) {
    result += ALPHABET[randomInt(ALPHABET.length)]
  }
  return result + SYMBOLS[randomInt(SYMBOLS.length)]
}

export { validatePasswordStrength } from '@/utils/validation'
