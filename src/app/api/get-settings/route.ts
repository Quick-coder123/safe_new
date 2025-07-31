import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Отримання категорій сейфів
    const { data: categories, error: categoriesError } = await supabase
      .from('safe_categories')
      .select('*')
      .order('id')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Отримання тарифів страхування
    const { data: insuranceRates, error: insuranceError } = await supabase
      .from('insurance_rates')
      .select('*')
      .order('min_days')

    if (insuranceError) {
      console.error('Error fetching insurance rates:', insuranceError)
      return NextResponse.json({ error: 'Failed to fetch insurance rates' }, { status: 500 })
    }

    // Отримання налаштувань
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Перетворення налаштувань у зручний формат
    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>) || {}

    return NextResponse.json({
      categories: categories || [],
      insuranceRates: insuranceRates || [],
      settings: settingsMap,
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
