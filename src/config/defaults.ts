// Тарифи за замовчуванням згідно з ТЗ (README.md).
// Використовуються як демо-дані, коли Supabase не налаштовано (локальна розробка).

export interface RawCategory {
  id: string
  name: string
  rate_up_to_30: number
  rate_31_to_90: number
  rate_91_to_180: number
  rate_181_to_365: number
}

export interface RawInsuranceRate {
  min_days: number
  max_days: number
  price: number
}

/** Ключі налаштувань, які дозволено змінювати через адмінку. */
export const SETTING_KEYS = [
  'trust_document_price',
  'package_price',
  'guarantee_amount',
  'company_name',
  'company_edrpou',
  'company_iban',
  'payment_purpose',
  'insurance_payment_url',
] as const

export type SettingKey = (typeof SETTING_KEYS)[number]

export const SETTING_DESCRIPTIONS: Record<SettingKey, string> = {
  trust_document_price: 'Вартість довіреності, грн',
  package_price: 'Вартість пакету, грн',
  guarantee_amount: 'Сума грошового забезпечення, грн',
  company_name: 'Отримувач платежу',
  company_edrpou: 'Код ЄДРПОУ отримувача',
  company_iban: 'IBAN отримувача',
  payment_purpose: 'Призначення платежу',
  insurance_payment_url: 'Посилання для оплати страхування ключа',
}

export const DEFAULT_CATEGORIES: RawCategory[] = [
  { id: 'I', name: 'І категорія', rate_up_to_30: 39, rate_31_to_90: 25, rate_91_to_180: 22, rate_181_to_365: 20 },
  { id: 'II', name: 'ІІ категорія', rate_up_to_30: 51, rate_31_to_90: 26, rate_91_to_180: 24, rate_181_to_365: 22 },
  { id: 'III', name: 'ІІІ категорія', rate_up_to_30: 63, rate_31_to_90: 28, rate_91_to_180: 26, rate_181_to_365: 24 },
  { id: 'IV', name: 'ІV категорія', rate_up_to_30: 63, rate_31_to_90: 35, rate_91_to_180: 33, rate_181_to_365: 29 },
]

export const DEFAULT_INSURANCE_RATES: RawInsuranceRate[] = [
  { min_days: 1, max_days: 90, price: 285 },
  { min_days: 91, max_days: 180, price: 370 },
  { min_days: 181, max_days: 270, price: 430 },
  { min_days: 271, max_days: 365, price: 500 },
]

export const DEFAULT_SETTINGS: Record<string, string> = {
  trust_document_price: '300',
  package_price: '30',
  guarantee_amount: '3000',
  company_name: '',
  company_edrpou: '',
  company_iban: '',
  payment_purpose: 'Оплата за оренду індивідуального сейфу',
  insurance_payment_url: '',
}

export const MAX_RENTAL_DAYS = 365
