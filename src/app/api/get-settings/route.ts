import { NextResponse } from 'next/server'
import { loadConfig } from '@/lib/settingsRepo'

export const dynamic = 'force-dynamic'

// Публічний ендпоінт: тарифи та реквізити для калькулятора
export async function GET() {
  try {
    return NextResponse.json(await loadConfig())
  } catch (error) {
    console.error('get-settings error:', error)
    return NextResponse.json({ error: 'Не вдалося завантажити налаштування' }, { status: 500 })
  }
}
