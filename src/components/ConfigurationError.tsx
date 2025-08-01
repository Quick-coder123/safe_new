'use client'

import { useEffect, useState } from 'react'

export default function ConfigurationError() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Перевіряємо тільки на клієнті
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
                         !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isPlaceholder) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-lg w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            Конфігурація не завершена
          </h2>
          <div className="text-red-700 space-y-4">
            <p className="text-lg">Змінні середовища Supabase не налаштовані.</p>
            
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="font-semibold mb-2">Потрібно додати в Vercel Environment Variables:</p>
              <div className="bg-white p-3 rounded text-xs font-mono text-left space-y-1">
                <div><strong>NEXT_PUBLIC_SUPABASE_URL</strong></div>
                <div><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong></div>
              </div>
            </div>

            <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800">
              <p className="font-semibold mb-2">Кроки для виправлення:</p>
              <ol className="text-sm list-decimal list-inside space-y-1 text-left">
                <li>Перейдіть в Settings проекту на Vercel</li>
                <li>Оберіть Environment Variables</li>
                <li>Додайте 2 змінні з файлу FINISH_CONFIGURATION.md</li>
                <li>Зробіть Redeploy</li>
              </ol>
            </div>
            
            <p className="text-sm">
              Детальні інструкції в файлі{' '}
              <code className="bg-red-100 px-2 py-1 rounded font-mono">
                FINISH_CONFIGURATION.md
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
