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
  min_rental_days: string;
  max_rental_days: string;
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Використовуємо тимчасовий ендпоінт
      const response = await fetch('/api/get-settings-temp')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const rawData = await response.json()
      
      // Конвертуємо плоску структуру в вкладену для categories
      const convertedCategories = rawData.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        rates: {
          up_to_30: cat.rate_up_to_30,
          from_31_to_90: cat.rate_31_to_90,
          from_91_to_180: cat.rate_91_to_180,
          from_181_to_365: cat.rate_181_to_365,
        }
      })) || []
      
      const data = {
        categories: convertedCategories,
        insuranceRates: rawData.insuranceRates || [],
        settings: rawData.settings || {}
      }
      
      setConfig(data)
    } catch (error) {
      console.error('Error loading config:', error)
      setError(error instanceof Error ? error.message : 'Failed to load configuration')
      
      // Fallback to default values if API fails
      setConfig({
        categories: [
          {
            id: 'I',
            name: 'І категорія',
            rates: {
              up_to_30: 39.00,
              from_31_to_90: 25.00,
              from_91_to_180: 20.00,
              from_181_to_365: 15.00,
            }
          }
        ],
        insuranceRates: [
          { min_days: 1, max_days: 30, price: 300 },
          { min_days: 31, max_days: 90, price: 600 },
          { min_days: 91, max_days: 180, price: 900 },
          { min_days: 181, max_days: 365, price: 1200 }
        ],
        settings: {
          min_rental_days: '1',
          max_rental_days: '365',
          trust_document_price: '300',
          package_price: '30',
          guarantee_amount: '3000'
        }
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return { config, loading, error, reload: loadConfig }
}
