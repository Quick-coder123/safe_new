import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Initializing database tables...')

    // 1. Перевіряємо та створюємо категорії сейфів
    const { data: existingCategories } = await supabase
      .from('safe_categories')
      .select('*')

    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Creating safe categories...')
      const { error: catError } = await supabase
        .from('safe_categories')
        .insert([
          { id: 'I', name: 'І категорія', rate_up_to_30: 39.00, rate_31_to_90: 25.00, rate_91_to_180: 22.00, rate_181_to_365: 20.00 },
          { id: 'II', name: 'ІІ категорія', rate_up_to_30: 51.00, rate_31_to_90: 26.00, rate_91_to_180: 24.00, rate_181_to_365: 22.00 },
          { id: 'III', name: 'ІІІ категорія', rate_up_to_30: 63.00, rate_31_to_90: 28.00, rate_91_to_180: 26.00, rate_181_to_365: 24.00 },
          { id: 'IV', name: 'ІV категорія', rate_up_to_30: 63.00, rate_31_to_90: 35.00, rate_91_to_180: 33.00, rate_181_to_365: 29.00 },
          { id: 'V', name: 'V категорія', rate_up_to_30: 75.00, rate_31_to_90: 40.00, rate_91_to_180: 38.00, rate_181_to_365: 35.00 }
        ])

      if (catError) {
        console.error('❌ Error creating categories:', catError)
      } else {
        console.log('✅ Categories created successfully')
      }
    } else {
      console.log('✅ Categories already exist:', existingCategories.length)
    }

    // 2. Перевіряємо та створюємо страхові ставки
    const { data: existingRates } = await supabase
      .from('insurance_rates')
      .select('*')

    if (!existingRates || existingRates.length === 0) {
      console.log('📝 Creating insurance rates...')
      const { error: rateError } = await supabase
        .from('insurance_rates')
        .insert([
          { min_days: 1, max_days: 90, price: 285.00 },
          { min_days: 91, max_days: 180, price: 370.00 },
          { min_days: 181, max_days: 270, price: 430.00 },
          { min_days: 271, max_days: 365, price: 500.00 }
        ])

      if (rateError) {
        console.error('❌ Error creating insurance rates:', rateError)
      } else {
        console.log('✅ Insurance rates created successfully')
      }
    } else {
      console.log('✅ Insurance rates already exist:', existingRates.length)
    }

    // 3. Перевіряємо структуру таблиці settings
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('*')

    console.log('📊 Current settings structure:', existingSettings)

    // Якщо таблиця використовує key-value структуру, конвертуємо в пряму структуру
    if (existingSettings && existingSettings.length > 0 && existingSettings[0].key) {
      console.log('🔄 Converting key-value settings to direct structure...')
      
      // Створюємо нову структуру settings
      const settingsObj: any = { id: 1 }
      existingSettings.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value
      })

      // Видаляємо старі записи
      await supabase.from('settings').delete().neq('id', 0)

      // Створюємо новий запис з прямою структурою
      const { error: newSettingsError } = await supabase
        .from('settings')
        .insert([settingsObj])

      if (newSettingsError) {
        console.error('❌ Error converting settings:', newSettingsError)
      } else {
        console.log('✅ Settings converted to direct structure')
      }
    } else if (!existingSettings || existingSettings.length === 0) {
      console.log('📝 Creating default settings...')
      const { error: settingsError } = await supabase
        .from('settings')
        .insert([{
          id: 1,
          trust_document_price: '300',
          package_price: '50',
          guarantee_amount: '5000'
        }])

      if (settingsError) {
        console.error('❌ Error creating settings:', settingsError)
      } else {
        console.log('✅ Default settings created')
      }
    } else {
      console.log('✅ Settings already exist in correct format')
    }

    // 4. Перевіряємо фінальний стан
    const { data: finalCategories } = await supabase.from('safe_categories').select('*')
    const { data: finalRates } = await supabase.from('insurance_rates').select('*')
    const { data: finalSettings } = await supabase.from('settings').select('*')

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      summary: {
        categories: finalCategories?.length || 0,
        insuranceRates: finalRates?.length || 0,
        settings: finalSettings?.length || 0
      },
      data: {
        categories: finalCategories,
        insuranceRates: finalRates,
        settings: finalSettings
      }
    })

  } catch (error) {
    console.error('❌ Database initialization error:', error)
    return NextResponse.json({
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
