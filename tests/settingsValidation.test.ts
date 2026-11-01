import { describe, expect, it } from 'vitest'
import { validateSettingsPayload } from '@/utils/settingsValidation'
import { diffConfig } from '@/utils/configDiff'
import { DEFAULT_CATEGORIES, DEFAULT_INSURANCE_RATES, DEFAULT_SETTINGS } from '@/config/defaults'

const validPayload = () => ({
  categories: [{ id: 'I', name: 'І категорія', rates: { up_to_30: 39, from_31_to_90: 25, from_91_to_180: 22, from_181_to_365: 20 } }],
  insuranceRates: [{ min_days: 1, max_days: 90, price: 285 }, { min_days: 91, max_days: 365, price: 500 }],
  settings: {
    trust_document_price: '300',
    package_price: '30',
    guarantee_amount: '3000',
    company_iban: 'ua74 3052 9900 0002 6007 2335 6600 1',
    company_edrpou: '12345678',
    insurance_payment_url: 'https://example.com/pay',
    unknown_key: 'ignored',
  },
})

describe('validateSettingsPayload', () => {
  it('приймає коректні дані та нормалізує IBAN', () => {
    const r = validateSettingsPayload(validPayload())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.settings.company_iban).toBe('UA743052990000026007233566001')
      expect(r.value.settings).not.toHaveProperty('unknown_key')
      expect(r.value.categories[0].rate_31_to_90).toBe(25)
    }
  })

  it('відхиляє невірний IBAN', () => {
    const p = validPayload()
    p.settings.company_iban = 'UA000000000000000000000000000'
    const r = validateSettingsPayload(p)
    expect(r.ok).toBe(false)
  })

  it('відхиляє перетин діапазонів страхування', () => {
    const p = validPayload()
    p.insuranceRates = [{ min_days: 1, max_days: 100, price: 1 }, { min_days: 90, max_days: 200, price: 2 }]
    const r = validateSettingsPayload(p)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join()).toMatch(/перетинаються/)
  })

  it('відхиляє від\'ємні тарифи, дублікати категорій та порожній список', () => {
    const p = validPayload()
    p.categories.push({ ...p.categories[0] })
    p.categories[0].rates.up_to_30 = -1
    const r = validateSettingsPayload(p)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(2)
    expect(validateSettingsPayload({ ...validPayload(), categories: [] }).ok).toBe(false)
  })

  it('відхиляє порожні або нечислові ціни та поганий URL', () => {
    const p = validPayload()
    p.settings.package_price = ''
    p.settings.insurance_payment_url = 'javascript:alert(1)'
    const r = validateSettingsPayload(p)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBe(2)
  })
})

describe('diffConfig', () => {
  const before = { categories: DEFAULT_CATEGORIES, insuranceRates: DEFAULT_INSURANCE_RATES, settings: DEFAULT_SETTINGS }

  it('без змін — порожній список', () => {
    expect(diffConfig(before, before)).toEqual([])
  })

  it('фіксує зміну тарифу, видалення категорії та налаштування', () => {
    const after = {
      categories: [{ ...DEFAULT_CATEGORIES[0], rate_up_to_30: 40 }],
      insuranceRates: DEFAULT_INSURANCE_RATES,
      settings: { ...DEFAULT_SETTINGS, package_price: '35' },
    }
    const changes = diffConfig(before, after)
    expect(changes).toContainEqual({ field: 'І категорія: до 30 днів', from: 39, to: 40 })
    expect(changes).toContainEqual({ field: 'package_price', from: '30', to: '35' })
    expect(changes.filter(c => c.to === 'видалено')).toHaveLength(3)
  })
})
