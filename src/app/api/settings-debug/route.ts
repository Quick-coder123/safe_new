import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug Settings API: Fetching settings...')
    
    // Отримуємо всі налаштування
    const { data: allSettings, error: allError } = await supabase
      .from('settings')
      .select('*')

    console.log('📊 All settings rows:', allSettings?.length || 0, allSettings)
    
    if (allError) {
      console.error('❌ Settings query error:', allError)
      return NextResponse.json({ 
        error: 'Failed to fetch settings', 
        details: allError.message 
      }, { status: 500 })
    }

    // Отримуємо категорії та страхові ставки
    const { data: categories, error: catError } = await supabase
      .from('safe_categories')
      .select('*')

    const { data: insuranceRates, error: insError } = await supabase
      .from('insurance_rates')
      .select('*')
      .order('min_days', { ascending: true })

    console.log('📊 Categories:', categories?.length || 0)
    console.log('📊 Insurance rates:', insuranceRates?.length || 0)

    if (catError) {
      console.error('❌ Categories error:', catError)
    }
    if (insError) {
      console.error('❌ Insurance rates error:', insError)
    }

    // Перевіряємо, чи потрібно ініціалізувати дані
    let needsInit = false
    if (!categories || categories.length === 0) {
      console.log('⚠️ Categories table is empty')
      needsInit = true
    }
    if (!insuranceRates || insuranceRates.length === 0) {
      console.log('⚠️ Insurance rates table is empty')
      needsInit = true
    }
    if (!allSettings || allSettings.length === 0) {
      console.log('⚠️ Settings table is empty')
      needsInit = true
    }

    let settings = null
    if (allSettings && allSettings.length > 0) {
      // Якщо є key-value структура, конвертуємо
      if (allSettings[0].key) {
        settings = {}
        allSettings.forEach((setting: any) => {
          settings[setting.key] = setting.value
        })
      } else {
        // Пряма структура
        settings = allSettings[0]
      }
    }

    return NextResponse.json({ 
      settings,
      categories,
      insuranceRates,
      debug: {
        settingsCount: allSettings?.length || 0,
        categoriesCount: categories?.length || 0,
        insuranceRatesCount: insuranceRates?.length || 0,
        needsInit,
        initUrl: needsInit ? '/api/init-database' : null,
        note: 'TEMPORARY: Auth check disabled for debugging'
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Save Settings API: Starting...')
    
    const body = await request.json()
    console.log('📝 Received settings:', body)

    // Зберігаємо основні налаштування
    if (body.settings) {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .upsert({ id: 1, ...body.settings }, { onConflict: 'id' })
        .select()
        .single()

      if (settingsError) {
        console.error('❌ Settings save error:', settingsError)
        return NextResponse.json({ 
          error: 'Failed to save settings', 
          details: settingsError.message 
        }, { status: 500 })
      }
      console.log('✅ Settings saved')
    }

    // Зберігаємо категорії
    if (body.categories && Array.isArray(body.categories)) {
      for (const category of body.categories) {
        const { error: catError } = await supabase
          .from('safe_categories')
          .upsert({
            id: category.id,
            name: category.name,
            rate_up_to_30: category.rates.up_to_30,
            rate_31_to_90: category.rates.from_31_to_90,
            rate_91_to_180: category.rates.from_91_to_180,
            rate_181_to_365: category.rates.from_181_to_365,
          }, { onConflict: 'id' })

        if (catError) {
          console.error('❌ Category save error:', catError)
          return NextResponse.json({ 
            error: 'Failed to save category', 
            details: catError.message 
          }, { status: 500 })
        }
      }
      console.log('✅ Categories saved')
    }

    // Зберігаємо страхові ставки
    if (body.insuranceRates && Array.isArray(body.insuranceRates)) {
      // Спочатку видаляємо всі існуючі
      await supabase.from('insurance_rates').delete().neq('id', 0)
      
      // Потім додаємо нові
      for (const rate of body.insuranceRates) {
        const { error: rateError } = await supabase
          .from('insurance_rates')
          .insert({
            min_days: rate.min_days,
            max_days: rate.max_days,
            price: rate.price
          })

        if (rateError) {
          console.error('❌ Insurance rate save error:', rateError)
          return NextResponse.json({ 
            error: 'Failed to save insurance rate', 
            details: rateError.message 
          }, { status: 500 })
        }
      }
      console.log('✅ Insurance rates saved')
    }

    console.log('✅ All data saved successfully')
    
    return NextResponse.json({ 
      success: true,
      debug: {
        note: 'TEMPORARY: Auth check disabled for debugging'
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
