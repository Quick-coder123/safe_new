import { describe, expect, it } from 'vitest'
import {
  addTermDays,
  calculateDays,
  calculateRental,
  getDaysDeclension,
  getInsurancePrice,
  getSafeRate,
  isWeekend,
  nextWorkingDay,
  parseDateFromInput,
  roundMoney,
  type CalculationInput,
  type SafeCategory,
} from '@/utils/calculator'
import { DEFAULT_CATEGORIES, DEFAULT_INSURANCE_RATES, DEFAULT_SETTINGS } from '@/config/defaults'

const categories: SafeCategory[] = DEFAULT_CATEGORIES.map(c => ({
  id: c.id,
  name: c.name,
  rates: {
    up_to_30: c.rate_up_to_30,
    from_31_to_90: c.rate_31_to_90,
    from_91_to_180: c.rate_91_to_180,
    from_181_to_365: c.rate_181_to_365,
  },
}))
const config = {
  categories,
  insuranceRates: DEFAULT_INSURANCE_RATES,
  settings: DEFAULT_SETTINGS as typeof DEFAULT_SETTINGS & {
    trust_document_price: string
    package_price: string
    guarantee_amount: string
  },
}
const d = parseDateFromInput

function input(overrides: Partial<CalculationInput> = {}): CalculationInput {
  return {
    category: 'I',
    contractType: 'new',
    coverageType: 'insurance',
    startDate: d('2025-03-03'),
    endDate: d('2025-04-02'),
    penalty: 0,
    trustDocuments: 0,
    packages: 0,
    ...overrides,
  }
}

describe('calculateDays', () => {
  it('рахує обидві дати включно', () => {
    expect(calculateDays(d('2025-01-01'), d('2025-01-01'))).toBe(1)
    expect(calculateDays(d('2025-01-01'), d('2025-01-31'))).toBe(31)
  })
  it('коректно проходить зміну часу (кінець березня)', () => {
    expect(calculateDays(d('2025-03-29'), d('2025-03-31'))).toBe(3)
  })
  it('враховує високосний рік', () => {
    expect(calculateDays(d('2024-01-01'), d('2024-12-31'))).toBe(366)
  })
  it('addTermDays є оберненою до calculateDays', () => {
    for (const days of [1, 30, 31, 90, 91, 180, 181, 365]) {
      expect(calculateDays(d('2025-01-15'), addTermDays(d('2025-01-15'), days))).toBe(days)
    }
  })
})

describe('getSafeRate — межі діапазонів', () => {
  it.each([
    [1, 39], [30, 39], [31, 25], [90, 25], [91, 22], [180, 22], [181, 20], [365, 20],
  ])('I категорія, %i днів → %i грн/день', (days, rate) => {
    expect(getSafeRate('I', days, categories)).toBe(rate)
  })
  it('невідома категорія → 0', () => {
    expect(getSafeRate('X', 10, categories)).toBe(0)
  })
})

describe('getInsurancePrice — межі за ТЗ', () => {
  it.each([
    [1, 285], [90, 285], [91, 370], [180, 370], [181, 430], [270, 430], [271, 500], [365, 500],
  ])('%i днів → %i грн', (days, price) => {
    expect(getInsurancePrice(days, DEFAULT_INSURANCE_RATES)).toBe(price)
  })
  it('понад 365 днів тарифу немає', () => {
    expect(getInsurancePrice(366, DEFAULT_INSURANCE_RATES)).toBe(0)
  })
})

describe('calculateRental', () => {
  it('новий договір зі страхуванням', () => {
    const r = calculateRental(input(), config)
    expect(r.days).toBe(31)
    expect(r.safeRate).toBe(25)
    expect(r.safeCost).toBe(775)
    expect(r.insurance).toBe(285)
    expect(r.guarantee).toBe(0)
    expect(r.totalCost).toBe(1060)
    expect(r.insuranceUnavailable).toBe(false)
    expect(r.exceedsMaxTerm).toBe(false)
  })

  it('грошове забезпечення лише для нового договору', () => {
    expect(calculateRental(input({ coverageType: 'guarantee' }), config).guarantee).toBe(3000)
    expect(calculateRental(input({ coverageType: 'guarantee', contractType: 'extension' }), config).guarantee).toBe(0)
  })

  it('додає довіреності, пакети та пеню', () => {
    const r = calculateRental(input({ trustDocuments: 2, packages: 3, penalty: 12.5 }), config)
    expect(r.trustDocumentsCost).toBe(600)
    expect(r.packagesCost).toBe(90)
    expect(r.penalty).toBe(12.5)
    expect(r.totalCost).toBe(775 + 285 + 600 + 90 + 12.5)
  })

  it('ігнорує від\'ємні значення', () => {
    const r = calculateRental(input({ trustDocuments: -1, packages: -2, penalty: -5 }), config)
    expect(r.trustDocumentsCost).toBe(0)
    expect(r.packagesCost).toBe(0)
    expect(r.penalty).toBe(0)
  })

  it('позначає термін понад 365 днів і відсутній тариф страхування', () => {
    const r = calculateRental(input({ startDate: d('2025-01-01'), endDate: d('2026-01-05') }), config)
    expect(r.exceedsMaxTerm).toBe(true)
    expect(r.insurance).toBe(0)
    expect(r.insuranceUnavailable).toBe(true)
  })

  it('округлює суми до копійок', () => {
    const r = calculateRental(input({ penalty: 0.1 + 0.2 }), config)
    expect(r.penalty).toBe(0.3)
    expect(roundMoney(1.005)).toBe(1.01)
  })
})

describe('вихідні', () => {
  it('визначає суботу та неділю незалежно від часового поясу', () => {
    expect(isWeekend(d('2025-03-01'))).toBe(true) // субота
    expect(isWeekend(d('2025-03-02'))).toBe(true) // неділя
    expect(isWeekend(d('2025-03-03'))).toBe(false) // понеділок
  })
  it('nextWorkingDay переносить на понеділок', () => {
    expect(nextWorkingDay(d('2025-03-01')).toISOString().slice(0, 10)).toBe('2025-03-03')
    expect(nextWorkingDay(d('2025-03-04')).toISOString().slice(0, 10)).toBe('2025-03-04')
  })
})

describe('getDaysDeclension', () => {
  it.each([
    [1, 'день'], [2, 'дні'], [4, 'дні'], [5, 'днів'], [11, 'днів'], [14, 'днів'],
    [21, 'день'], [22, 'дні'], [111, 'днів'], [365, 'днів'],
  ])('%i → %s', (n, word) => {
    expect(getDaysDeclension(n)).toBe(word)
  })
})
