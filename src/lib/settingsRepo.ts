import 'server-only'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INSURANCE_RATES,
  DEFAULT_SETTINGS,
  type RawCategory,
  type RawInsuranceRate,
} from '@/config/defaults'

export interface RawConfig {
  categories: RawCategory[]
  insuranceRates: RawInsuranceRate[]
  settings: Record<string, string>
  demo?: boolean
}

const num = (v: unknown) => Number(v)

/** Читає повну конфігурацію калькулятора з бази. */
export async function loadConfig(): Promise<RawConfig> {
  if (!isSupabaseConfigured()) {
    return {
      categories: DEFAULT_CATEGORIES,
      insuranceRates: DEFAULT_INSURANCE_RATES,
      settings: DEFAULT_SETTINGS,
      demo: true,
    }
  }

  const supabase = getSupabase()
  const [categories, insuranceRates, settings] = await Promise.all([
    supabase.from('safe_categories').select('id, name, rate_up_to_30, rate_31_to_90, rate_91_to_180, rate_181_to_365').order('id'),
    supabase.from('insurance_rates').select('min_days, max_days, price').order('min_days'),
    supabase.from('settings').select('key, value'),
  ])

  const error = categories.error || insuranceRates.error || settings.error
  if (error) throw new Error(`Помилка читання налаштувань: ${error.message}`)

  const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const row of settings.data ?? []) settingsMap[row.key] = row.value ?? ''

  return {
    // DECIMAL з Postgres може прийти рядком — приводимо до числа
    categories: (categories.data ?? []).map(c => ({
      id: c.id,
      name: c.name,
      rate_up_to_30: num(c.rate_up_to_30),
      rate_31_to_90: num(c.rate_31_to_90),
      rate_91_to_180: num(c.rate_91_to_180),
      rate_181_to_365: num(c.rate_181_to_365),
    })),
    insuranceRates: (insuranceRates.data ?? []).map(r => ({
      min_days: num(r.min_days),
      max_days: num(r.max_days),
      price: num(r.price),
    })),
    settings: settingsMap,
  }
}
