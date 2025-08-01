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
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            Конфігурація не завершена
          </h2>
          <div className="text-red-700 space-y-3">
            <p>Змінні середовища Supabase не налаштовані.</p>
            <p className="text-sm">
              Для роботи додатку потрібно додати змінні середовища в налаштуваннях Vercel:
            </p>
            <div className="bg-red-100 p-3 rounded text-xs font-mono text-left">
              <div>NEXT_PUBLIC_SUPABASE_URL</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            </div>
            <p className="text-sm">
              Див. файл <code className="bg-red-100 px-1 rounded">VERCEL_DEPLOY.md</code> для детальних інструкцій.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
