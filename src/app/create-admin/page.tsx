'use client'

import { useEffect, useState } from 'react'
import { validatePasswordStrength } from '@/utils/validation'

/**
 * Початкове налаштування: створення першого супер-адміністратора.
 * Доступне лише поки в базі немає жодного адміністратора (перевіряє сервер).
 */
export default function CreateAdminPage() {
  const [setupAvailable, setSetupAvailable] = useState<boolean | null>(null)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/create-admin')
      .then(r => r.json())
      .then(d => setSetupAvailable(!!d.setupAvailable))
      .catch(() => setSetupAvailable(false))
  }, [])

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Паролі не співпадають' })
      return
    }
    const strength = validatePasswordStrength(password)
    if (!strength.valid) {
      setMessage({ type: 'error', text: strength.error! })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Супер-адміністратора "${login}" створено. Тепер увійдіть на головній сторінці.` })
        setSetupAvailable(false)
        setPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Не вдалося створити адміністратора' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Помилка з\'єднання' })
    } finally {
      setLoading(false)
    }
  }

  if (setupAvailable === null) {
    return <div className="text-center mt-8 text-gray-600">Перевірка…</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="calculator-card">
        <h1 className="text-2xl font-bold mb-6 text-center">
          👤 Створення першого супер-адміністратора
        </h1>

        {!setupAvailable && !message && (
          <div className="alert-warning">
            Початкове налаштування вже виконано. Нових адміністраторів додає супер-адміністратор
            в <a href="/admin" className="underline">адмін-панелі</a>.
          </div>
        )}

        {setupAvailable && (
          <form onSubmit={createAdmin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Логін адміністратора</label>
              <input
                type="text"
                className="form-input"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_-]+"
                title="Логін може містити тільки латинські букви, цифри, підкреслення та дефіси"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-600 mt-1">Мінімум 10 символів, великі та малі літери і цифри.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Повторіть пароль</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="w-full btn-primary" disabled={loading}>
              {loading ? 'Створення...' : 'Створити адміністратора'}
            </button>
          </form>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
