import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug Settings API: Fetching settings...')
    
    // Спочатку перевіримо, що є в таблиці settings
    const { data: allSettings, error: allError } = await supabase
      .from('settings')
      .select('*')

    console.log('📊 All settings rows:', allSettings?.length || 0, allSettings)
    
    if (allError) {
      console.error('❌ Settings query error:', allError)
    }

    // Тепер отримаємо категорії та страхові ставки
    const { data: categories, error: catError } = await supabase
      .from('safe_categories')
      .select('*')

    const { data: insuranceRates, error: insError } = await supabase
      .from('insurance_rates')
      .select('*')
      .order('min_days', { ascending: true })

    console.log('📊 Categories:', categories?.length || 0)
    console.log('📊 Insurance rates:', insuranceRates?.length || 0)

    // Якщо немає записів в settings, створимо дефолтний
    let settings = null
    if (!allSettings || allSettings.length === 0) {
      console.log('📝 Creating default settings...')
      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert([{
          id: 1,
          trust_document_price: '100',
          package_price: '50',
          guarantee_amount: '10000'
        }])
        .select()
        .single()

      if (createError) {
        console.error('❌ Create settings error:', createError)
      } else {
        settings = newSettings
        console.log('✅ Default settings created')
      }
    } else {
      settings = allSettings[0] // Беремо перший запис
    }

    return NextResponse.json({ 
      settings,
      categories,
      insuranceRates,
      debug: {
        settingsCount: allSettings?.length || 0,
        categoriesCount: categories?.length || 0,
        insuranceRatesCount: insuranceRates?.length || 0,
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
