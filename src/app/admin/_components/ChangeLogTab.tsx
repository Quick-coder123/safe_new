'use client'

import { useEffect, useState } from 'react'

interface ChangeLogEntry {
  id: number
  admin_login: string | null
  action: string
  details: { changes?: { field: string; from: unknown; to: unknown }[]; [key: string]: unknown } | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  'settings.update': 'Зміна тарифів/налаштувань',
  'admin.create': 'Створено адміністратора',
  'admin.delete': 'Видалено адміністратора',
  'admin.role_change': 'Змінено роль',
  'admin.password_reset': 'Скинуто пароль',
  'admin.password_change': 'Змінено власний пароль',
  'safe.create': 'Додано сейф',
  'safe.update': 'Змінено сейф',
  'safe.delete': 'Видалено сейф',
  'block.create': 'Додано блок',
  'block.update': 'Змінено блок',
  'block.delete': 'Видалено блок',
}

/** Вкладка «Журнал змін» — останні дії адміністраторів. */
export default function ChangeLogTab() {
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([])
  const [changeLogsError, setChangeLogsError] = useState('')

  const loadChangeLogs = async () => {
    try {
      setChangeLogsError('')
      const response = await fetch('/api/change-logs?limit=200')
      const data = await response.json()
      if (response.ok) setChangeLogs(data.logs || [])
      else setChangeLogsError(data.error || 'Не вдалося завантажити журнал')
    } catch {
      setChangeLogsError('Не вдалося завантажити журнал')
    }
  }

  useEffect(() => {
    loadChangeLogs()
  }, [])

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="mr-2">📜</span>
          Журнал змін
        </h2>
        <button type="button" onClick={loadChangeLogs} className="btn-secondary text-sm">🔄 Оновити</button>
      </div>
      {changeLogsError && <div className="alert-warning mb-4">{changeLogsError}</div>}
      {!changeLogsError && changeLogs.length === 0 && (
        <p className="text-gray-600">Записів поки немає.</p>
      )}
      <div className="space-y-3">
        {changeLogs.map(log => (
          <div key={log.id} className="border rounded-lg p-3 bg-white">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-semibold text-gray-900">{ACTION_LABELS[log.action] || log.action}</span>
              <span className="text-gray-600">
                {new Date(log.created_at).toLocaleString('uk-UA')} · {log.admin_login || '—'}
              </span>
            </div>
            {log.details?.changes && log.details.changes.length > 0 ? (
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                {log.details.changes.map((c, i) => (
                  <li key={i}>
                    {c.field}: <span className="line-through text-gray-500">{String(c.from ?? '—')}</span> → <strong>{String(c.to ?? '—')}</strong>
                  </li>
                ))}
              </ul>
            ) : log.details && Object.keys(log.details).length > 0 ? (
              <p className="mt-2 text-xs text-gray-600 font-mono break-all">
                {Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ')}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
