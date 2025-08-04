import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
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
