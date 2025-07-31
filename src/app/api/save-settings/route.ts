import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { categories, insuranceRates, settings } = await request.json()

    // Перевірка аутентифікації
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Оновлення категорій сейфів
    if (categories && Array.isArray(categories)) {
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
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value: String(value),
            description: getSettingDescription(key),
          })

        if (error) {
          console.error('Error updating setting:', error)
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    trust_document_price: 'Вартість довіреності в грн',
    package_price: 'Вартість пакету в грн',
    company_name: 'Назва компанії',
    company_edrpou: 'Код ЄДРПОУ',
    company_iban: 'IBAN рахунок',
    payment_purpose: 'Призначення платежу',
  }
  return descriptions[key] || ''
}
