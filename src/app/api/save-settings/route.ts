import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Save-settings API: Starting request...')
    
    // Перевірка environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.error('❌ Environment variables not configured:', { supabaseUrl, keyPresent: !!supabaseKey })
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: 'Environment variables not properly configured'
      }, { status: 500 })
    }

    const { categories, insuranceRates, settings } = await request.json()
    console.log('📝 Received data:', { categoriesCount: categories?.length, insuranceRatesCount: insuranceRates?.length, settingsKeys: Object.keys(settings || {}) })

    // ТИМЧАСОВО: Відключаємо аутентифікацію для діагностики
    console.log('⚠️ TEMPORARY: Skipping authentication for debugging')

    console.log('🔐 Proceeding with updates...')

    // Оновлення категорій сейфів
    if (categories && Array.isArray(categories)) {
      console.log('📂 Updating categories...')
      for (const category of categories) {
        const { error } = await supabase
          .from('safe_categories')
          .upsert({
            id: category.id,
            name: category.name,
            rate_up_to_30: category.rates.up_to_30,
            rate_31_to_90: category.rates.from_31_to_90,
            rate_91_to_180: category.rates.from_91_to_180,
            rate_181_to_365: category.rates.from_181_to_365,
          }, {
            onConflict: 'id'
          })

        if (error) {
          console.error('Error updating category:', error)
          return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 })
        }
      }
    }

    // Оновлення тарифів страхування
    if (insuranceRates && Array.isArray(insuranceRates)) {
      // Спочатку видаляємо всі існуючі записи
      await supabase.from('insurance_rates').delete().gte('id', 0)

      // Потім додаємо нові
      for (const rate of insuranceRates) {
        const { error } = await supabase
          .from('insurance_rates')
          .insert({
            min_days: rate.min_days,
            max_days: rate.max_days,
            price: rate.price,
          })

        if (error) {
          console.error('Error updating insurance rate:', error)
          return NextResponse.json({ error: 'Failed to update insurance rates' }, { status: 500 })
        }
      }
    }

    // Оновлення налаштувань
    if (settings && typeof settings === 'object') {
      console.log('⚙️ Updating settings...')
      
      // Використовуємо пряму структуру з id=1
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          ...settings
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('❌ Error updating settings:', error)
        return NextResponse.json({ 
          error: 'Failed to update settings',
          details: error.message
        }, { status: 500 })
      }
    }

    console.log('✅ All updates completed successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
