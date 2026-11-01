import { SETTING_KEYS, MAX_RENTAL_DAYS, type RawCategory, type RawInsuranceRate } from '@/config/defaults'
import { isValidHttpUrl, normalizeIban, validateEdrpou, validateIban } from '@/utils/validation'

export interface SettingsPayload {
  categories: RawCategory[]
  insuranceRates: RawInsuranceRate[]
  settings: Record<string, string>
}

type Result = { ok: true; value: SettingsPayload } | { ok: false; errors: string[] }

const isMoney = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1_000_000

/** Перевіряє та нормалізує дані, що надходять з адмін-панелі. */
export function validateSettingsPayload(input: unknown): Result {
  const errors: string[] = []
  const body = (input ?? {}) as Record<string, unknown>

  // --- Категорії ---
  const categories: RawCategory[] = []
  if (!Array.isArray(body.categories) || body.categories.length === 0) {
    errors.push('Потрібна щонайменше одна категорія сейфів')
  } else {
    const ids = new Set<string>()
    body.categories.forEach((raw, i) => {
      const c = (raw ?? {}) as Record<string, unknown>
      const rates = (c.rates ?? {}) as Record<string, unknown>
      const id = typeof c.id === 'string' ? c.id.trim() : ''
      const name = typeof c.name === 'string' ? c.name.trim() : ''
      const label = name || id || `#${i + 1}`

      if (!/^[A-Za-zІіVvXx0-9_-]{1,10}$/.test(id)) errors.push(`Категорія ${label}: некоректний код (1–10 символів)`)
      else if (ids.has(id)) errors.push(`Категорія ${label}: код "${id}" повторюється`)
      ids.add(id)
      if (!name || name.length > 100) errors.push(`Категорія ${label}: назва обов'язкова (до 100 символів)`)

      const values = {
        rate_up_to_30: Number(rates.up_to_30 ?? c.rate_up_to_30),
        rate_31_to_90: Number(rates.from_31_to_90 ?? c.rate_31_to_90),
        rate_91_to_180: Number(rates.from_91_to_180 ?? c.rate_91_to_180),
        rate_181_to_365: Number(rates.from_181_to_365 ?? c.rate_181_to_365),
      }
      if (!Object.values(values).every(isMoney)) errors.push(`Категорія ${label}: тарифи мають бути невід'ємними числами`)
      categories.push({ id, name, ...values })
    })
  }

  // --- Страхування ключа ---
  const insuranceRates: RawInsuranceRate[] = []
  if (!Array.isArray(body.insuranceRates)) {
    errors.push('Некоректні тарифи страхування')
  } else {
    body.insuranceRates.forEach((raw, i) => {
      const r = (raw ?? {}) as Record<string, unknown>
      const rate = { min_days: Number(r.min_days), max_days: Number(r.max_days), price: Number(r.price) }
      const label = `Страхування, рядок ${i + 1}`
      if (!Number.isInteger(rate.min_days) || !Number.isInteger(rate.max_days) || rate.min_days < 1) {
        errors.push(`${label}: кількість днів має бути цілим числом ≥ 1`)
      } else if (rate.min_days > rate.max_days) {
        errors.push(`${label}: мін. днів більше за макс.`)
      } else if (rate.max_days > MAX_RENTAL_DAYS) {
        errors.push(`${label}: макс. днів не може перевищувати ${MAX_RENTAL_DAYS}`)
      }
      if (!isMoney(rate.price)) errors.push(`${label}: ціна має бути невід'ємним числом`)
      insuranceRates.push(rate)
    })
    const sorted = [...insuranceRates].sort((a, b) => a.min_days - b.min_days)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_days <= sorted[i - 1].max_days) {
        errors.push(`Страхування: діапазони ${sorted[i - 1].min_days}–${sorted[i - 1].max_days} та ${sorted[i].min_days}–${sorted[i].max_days} перетинаються`)
      }
    }
  }

  // --- Налаштування ---
  const settings: Record<string, string> = {}
  const rawSettings = (body.settings ?? {}) as Record<string, unknown>
  for (const key of SETTING_KEYS) {
    if (rawSettings[key] === undefined || rawSettings[key] === null) continue
    settings[key] = String(rawSettings[key]).trim()
  }

  for (const key of ['trust_document_price', 'package_price', 'guarantee_amount'] as const) {
    if (settings[key] !== undefined && (settings[key] === '' || !isMoney(Number(settings[key])))) {
      errors.push(`Поле "${key}" має бути невід'ємним числом`)
    }
  }
  if (settings.company_iban) {
    settings.company_iban = normalizeIban(settings.company_iban)
    const r = validateIban(settings.company_iban)
    if (!r.valid) errors.push(`IBAN: ${r.error}`)
  }
  if (settings.company_edrpou) {
    const r = validateEdrpou(settings.company_edrpou)
    if (!r.valid) errors.push(r.error!)
  }
  if (settings.company_name && settings.company_name.length > 200) errors.push('Отримувач: до 200 символів')
  if (settings.payment_purpose && settings.payment_purpose.length > 500) errors.push('Призначення платежу: до 500 символів')
  if (settings.insurance_payment_url && !isValidHttpUrl(settings.insurance_payment_url)) {
    errors.push('Посилання для оплати страхування має бути коректним URL (https://...)')
  }

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: { categories, insuranceRates, settings } }
}
