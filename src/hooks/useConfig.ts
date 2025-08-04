import { useState, useEffect } from 'react'

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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Використовуємо тимчасовий ендпоінт
        const response = await fetch('/api/get-settings-temp')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
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
            max_rental_days: '365'
          }
        })
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  return { config, loading, error, reload: () => useEffect(() => {}, []) }
}
