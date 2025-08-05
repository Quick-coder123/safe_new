import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    // Перевіряємо наявність змінних середовища
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseUrl === 'https://your-project-id.supabase.co' ||
        supabaseAnonKey === 'placeholder-key' ||
        supabaseAnonKey === 'your-anon-key-here') {
      
      console.warn('❌ Supabase not configured, returning fallback data')
      return NextResponse.json({
        categories: [
          {
            id: 'I',
            name: 'І категорія',
            rate_up_to_30: 39.00,
            rate_31_to_90: 25.00,
            rate_91_to_180: 20.00,
            rate_181_to_365: 15.00,
          },
          {
            id: 'II',
            name: 'ІІ категорія',
            rate_up_to_30: 49.00,
            rate_31_to_90: 35.00,
            rate_91_to_180: 30.00,
            rate_181_to_365: 25.00,
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
        },
        debug: {
          note: 'Using fallback data - Supabase not configured',
          supabaseConfigured: false
        }
      })
    }

    const supabase = createSupabaseClient()
    console.log('🔍 Get-settings TEMP API: Starting without auth...')

    const [categoriesResult, insuranceRatesResult, settingsResult] = await Promise.all([
      supabase.from('safe_categories').select('*').order('id'),
      supabase.from('insurance_rates').select('*').order('min_days'),
      supabase.from('settings').select('*')
    ])

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    if (insuranceRatesResult.error) {
      console.error('Error fetching insurance rates:', insuranceRatesResult.error)
      return NextResponse.json({ error: 'Failed to fetch insurance rates' }, { status: 500 })
    }

    if (settingsResult.error) {
      console.error('Error fetching settings:', settingsResult.error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Конвертуємо налаштування з key-value формату в об'єкт
    const settingsObject: { [key: string]: string } = {}
    settingsResult.data.forEach((setting: any) => {
      settingsObject[setting.key] = setting.value
    })

    console.log('✅ Successfully loaded all data without auth')

    return NextResponse.json({
      categories: categoriesResult.data,
      insuranceRates: insuranceRatesResult.data,
      settings: settingsObject,
      debug: {
        note: 'TEMPORARY: No authentication check',
        categoriesCount: categoriesResult.data.length,
        insuranceRatesCount: insuranceRatesResult.data.length,
        settingsCount: settingsResult.data.length
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
