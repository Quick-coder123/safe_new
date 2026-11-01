import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { loadConfig } from '@/lib/settingsRepo'
import { SETTING_DESCRIPTIONS, type SettingKey } from '@/config/defaults'
import { validateSettingsPayload } from '@/utils/settingsValidation'
import { diffConfig } from '@/utils/configDiff'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const validation = validateSettingsPayload(await request.json().catch(() => null))
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'Перевірте введені дані', details: validation.errors },
        { status: 400 }
      )
    }
    const { categories, insuranceRates, settings } = validation.value
    const supabase = getSupabase()
    const before = await loadConfig()

    // 1. Категорії: upsert + видалення тих, яких більше немає у списку
    const { error: catError } = await supabase.from('safe_categories').upsert(categories, { onConflict: 'id' })
    if (catError) throw new Error(`categories: ${catError.message}`)

    const keepIds = new Set(categories.map(c => c.id))
    const removedIds = before.categories.map(c => c.id).filter(id => !keepIds.has(id))
    if (removedIds.length) {
      const { error } = await supabase.from('safe_categories').delete().in('id', removedIds)
      if (error) throw new Error(`categories delete: ${error.message}`)
    }

    // 2. Страхування: повна заміна (дані вже провалідовані)
    const { error: delError } = await supabase.from('insurance_rates').delete().gte('id', 0)
    if (delError) throw new Error(`insurance delete: ${delError.message}`)
    if (insuranceRates.length) {
      const { error } = await supabase.from('insurance_rates').insert(insuranceRates)
      if (error) throw new Error(`insurance insert: ${error.message}`)
    }

    // 3. Налаштування (key-value)
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      description: SETTING_DESCRIPTIONS[key as SettingKey] ?? '',
    }))
    if (rows.length) {
      const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
      if (error) throw new Error(`settings: ${error.message}`)
    }

    const changes = diffConfig(before, { categories, insuranceRates, settings })
    if (changes.length) await logAction(auth.admin, 'settings.update', { changes })

    return NextResponse.json({ success: true, changes: changes.length })
  } catch (error) {
    console.error('save-settings error:', error)
    return NextResponse.json({ error: 'Не вдалося зберегти налаштування' }, { status: 500 })
  }
}
