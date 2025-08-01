'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  isRequired?: boolean
}

export default function PasswordChangeModal({ isOpen, onClose, isRequired = false }: PasswordChangeModalProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Функція для перевірки міцності пароля
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = [
      { test: password.length >= 8, points: 1 },
      { test: /[a-z]/.test(password), points: 1 },
      { test: /[A-Z]/.test(password), points: 1 },
      { test: /[0-9]/.test(password), points: 1 },
      { test: /[^A-Za-z0-9]/.test(password), points: 1 },
    ]
    
    checks.forEach(check => {
      if (check.test) score += check.points
    })
    
    if (score < 3) return { level: 'weak', color: 'red', text: 'Слабкий' }
    if (score < 4) return { level: 'medium', color: 'yellow', text: 'Середній' }
    return { level: 'strong', color: 'green', text: 'Надійний' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Нові паролі не співпадають')
      return
    }

    if (newPassword.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Помилка авторизації')
        return
      }

      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        // Оновлюємо статус тимчасового пароля
        await supabase
          .from('administrators')
          .update({ is_temp_password: false })
          .eq('user_id', session.user.id)

        alert('Пароль успішно змінено!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        onClose()
        
        if (isRequired) {
          // Перезавантажуємо сторінку, щоб оновити стан
          window.location.reload()
        }
      } else {
        const { error } = await response.json()
        setError(error || 'Помилка зміни пароля')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Помилка зміни пароля')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!isRequired) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isRequired ? '🔒 Обов\'язкова зміна пароля' : '🔑 Зміна пароля'}
          </h2>
          {!isRequired && (
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>

        {isRequired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              Ви використовуєте тимчасовий пароль. З міркувань безпеки необхідно змінити його на власний.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Поточний пароль</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Новий пароль</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500 w-1/3' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.color === 'red' ? 'text-red-600' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Рекомендації: мінімум 8 символів, великі та малі літери, цифри, спеціальні символи
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Підтвердити новий пароль</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Змінюємо...' : 'Змінити пароль'}
            </button>
            {!isRequired && (
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
