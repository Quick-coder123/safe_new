import { useState, useEffect, useCallback } from 'react'

export interface SafeCategory {
  id: string;
  name: string;
  rates: {
    up_to_30: number;
    from_31_to_90: number;
    from_91_to_180: number;
    from_181_to_365: number;
  };
}

export interface InsuranceRate {
  min_days: number;
  max_days: number;
  price: number;
}

export interface Settings {
  trust_document_price: string;
  package_price: string;
  guarantee_amount: string;
  [key: string]: string;
}

export interface ConfigData {
  categories: SafeCategory[];
  insuranceRates: InsuranceRate[];
  settings: Settings;
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/get-settings', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const rawData = await response.json()
      setDemo(!!rawData.demo)
      setConfig({
        categories: (rawData.categories ?? []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          rates: {
            up_to_30: Number(cat.rate_up_to_30),
            from_31_to_90: Number(cat.rate_31_to_90),
            from_91_to_180: Number(cat.rate_91_to_180),
            from_181_to_365: Number(cat.rate_181_to_365),
          },
        })),
        insuranceRates: (rawData.insuranceRates ?? []).map((r: any) => ({
          min_days: Number(r.min_days),
          max_days: Number(r.max_days),
          price: Number(r.price),
        })),
        settings: rawData.settings ?? {},
      })
    } catch (err) {
      console.error('Error loading config:', err)
      // Свідомо НЕ підставляємо «запасні» тарифи: клієнт не повинен бачити неактуальні ціни
      setConfig(null)
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити конфігурацію')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return { config, demo, loading, error, reload: loadConfig }
}
