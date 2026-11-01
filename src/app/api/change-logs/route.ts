import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// GET — журнал змін (останні записи)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 100, 1), 500)
  const { data, error } = await getSupabase()
    .from('admin_audit_log')
    .select('id, admin_login, action, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('change-logs error:', error.message)
    return NextResponse.json(
      { error: 'Не вдалося завантажити журнал. Чи виконано міграцію database/migrations/001_security_hardening.sql?' },
      { status: 500 }
    )
  }
  return NextResponse.json({ logs: data ?? [] })
}
