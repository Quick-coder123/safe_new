import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'

type Context = { params: Promise<{ id: string }> }

async function countSuperAdmins(): Promise<number> {
  const { count } = await getSupabase()
    .from('administrators')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin')
  return count ?? 0
}

// PUT — змінити роль
export async function PUT(request: NextRequest, context: Context) {
  try {
    const auth = await requireAdmin(request, { superAdmin: true })
    if (!auth.ok) return auth.response

    const id = Number((await context.params).id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Некоректний ID' }, { status: 400 })
    if (id === auth.admin.id) {
      return NextResponse.json({ error: 'Не можна змінювати власну роль' }, { status: 400 })
    }

    const { role } = await request.json().catch(() => ({}))
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Некоректна роль' }, { status: 400 })
    }

    const { data: updated, error } = await getSupabase()
      .from('administrators')
      .update({ role })
      .eq('id', id)
      .select('id, login, role')
      .maybeSingle()

    if (error) {
      console.error('Role update error:', error.message)
      return NextResponse.json({ error: 'Не вдалося оновити роль' }, { status: 500 })
    }
    if (!updated) return NextResponse.json({ error: 'Адміністратора не знайдено' }, { status: 404 })

    await logAction(auth.admin, 'admin.role_change', { targetId: id, targetLogin: updated.login, role })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Role update exception:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}

// DELETE — видалити адміністратора
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const auth = await requireAdmin(request, { superAdmin: true })
    if (!auth.ok) return auth.response

    const id = Number((await context.params).id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Некоректний ID' }, { status: 400 })
    if (id === auth.admin.id) {
      return NextResponse.json({ error: 'Не можна видалити самого себе' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: target } = await supabase
      .from('administrators')
      .select('id, login, role')
      .eq('id', id)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'Адміністратора не знайдено' }, { status: 404 })

    if (target.role === 'super_admin' && (await countSuperAdmins()) <= 1) {
      return NextResponse.json({ error: 'Не можна видалити останнього супер-адміністратора' }, { status: 400 })
    }

    const { error } = await supabase.from('administrators').delete().eq('id', id)
    if (error) {
      console.error('Delete admin error:', error.message)
      return NextResponse.json({ error: 'Не вдалося видалити адміністратора' }, { status: 500 })
    }

    await logAction(auth.admin, 'admin.delete', { targetId: id, targetLogin: target.login })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin exception:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
