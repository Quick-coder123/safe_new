// Валідація реквізитів та паролів (використовується і на клієнті, і на сервері)

/** Нормалізує IBAN: прибирає пробіли, переводить у верхній регістр. */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

/**
 * Перевірка українського IBAN: "UA" + 2 контрольні цифри + 25 цифр (разом 29 символів)
 * та контрольна сума за алгоритмом ISO 13616 (mod 97).
 */
export function validateIban(iban: string): { valid: boolean; error?: string } {
  const value = normalizeIban(iban)
  if (!value) return { valid: false, error: 'IBAN не може бути порожнім' }
  if (!value.startsWith('UA')) return { valid: false, error: 'IBAN повинен починатися з "UA"' }
  if (value.length !== 29) return { valid: false, error: `IBAN повинен містити 29 символів (зараз ${value.length})` }
  if (!/^UA\d{27}$/.test(value)) return { valid: false, error: 'Після "UA" повинні йти лише цифри' }

  const rearranged = value.slice(4) + value.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, ch => String(ch.charCodeAt(0) - 55))
  let remainder = 0
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97
  }
  if (remainder !== 1) return { valid: false, error: 'Невірна контрольна сума IBAN' }
  return { valid: true }
}

/** ЄДРПОУ (8 цифр, юр. особи) або РНОКПП (10 цифр, ФОП). */
export function validateEdrpou(code: string): { valid: boolean; error?: string } {
  const value = code.trim()
  if (!/^\d{8}$|^\d{10}$/.test(value)) {
    return { valid: false, error: 'Код ЄДРПОУ має містити 8 цифр (або 10 для РНОКПП)' }
  }
  return { valid: true }
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 10) {
    return { valid: false, error: 'Пароль має містити щонайменше 10 символів' }
  }
  if (!/[a-zа-яіїєґ]/.test(password) || !/[A-ZА-ЯІЇЄҐ]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: 'Пароль має містити великі та малі літери і цифри' }
  }
  return { valid: true }
}

export const LOGIN_PATTERN = /^[a-zA-Z0-9_-]{3,50}$/

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
