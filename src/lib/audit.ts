import 'server-only'
import { getSupabase } from '@/lib/supabase'
import type { AuthenticatedAdmin } from '@/lib/auth'

export type AuditAction =
  | 'settings.update'
  | 'admin.create'
  | 'admin.delete'
  | 'admin.role_change'
  | 'admin.password_reset'
  | 'admin.password_change'
  | 'safe.create'
  | 'safe.update'
  | 'safe.delete'
  | 'block.create'
  | 'block.update'
  | 'block.delete'

/**
 * Записує дію в журнал змін (таблиця admin_audit_log).
 * Помилка запису журналу не ламає основну операцію.
 */
export async function logAction(
  admin: Pick<AuthenticatedAdmin, 'id' | 'login'> | null,
  action: AuditAction,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await getSupabase().from('admin_audit_log').insert({
      admin_id: admin?.id ?? null,
      admin_login: admin?.login ?? null,
      action,
      details,
    })
    if (error) console.error('Audit log: не вдалося записати', error.message)
  } catch (error) {
    console.error('Audit log: виняток', error)
  }
}
