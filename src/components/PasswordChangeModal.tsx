'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { validatePasswordStrength } from '@/utils/validation'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  isRequired?: boolean
  onSuccess?: (message: string) => void
}

export default function PasswordChangeModal({ isOpen, onClose, isRequired = false, onSuccess }: PasswordChangeModalProps) {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Функція для перевірки міцності пароля
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = [
      { test: password.length >= 10, points: 1 },
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

    const strength = validatePasswordStrength(newPassword)
    if (!strength.valid) {
      setError(strength.error!)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const successMessage = 'Пароль успішно змінено!'
        if (onSuccess) {
          onSuccess(successMessage)
        }
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        if (onSuccess) {
          setShowSuccess(true)
          setTimeout(() => {
            onSuccess('Пароль успішно змінено')
            handleAnimatedClose()
          }, 1500)
        } else {
          handleAnimatedClose()
        }
        
        if (isRequired) {
          // Оновлюємо сесію для відображення змін в контексті
          await refreshSession()
        }
      } else {
        setError(data.error || 'Помилка зміни пароля')
        // Додаємо shake анімацію при помилці
        const modalElement = document.querySelector('.modal-content')
        if (modalElement) {
          modalElement.classList.add('shake')
          setTimeout(() => modalElement.classList.remove('shake'), 500)
        }
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Помилка зміни пароля')
      // Додаємо shake анімацію при помилці
      const modalElement = document.querySelector('.modal-content')
      if (modalElement) {
        modalElement.classList.add('shake')
        setTimeout(() => modalElement.classList.remove('shake'), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnimatedClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setShowSuccess(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      onClose()
    }, 300)
  }

  const handleClose = () => {
    if (!isRequired) {
      handleAnimatedClose()
    }
  }

  // Скидання станів при відкритті модального вікна
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setShowSuccess(false)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
  <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay ${isClosing ? 'closing' : ''}`}>
      {showSuccess ? (
        // Екран успіху
        <div className="modal-content bounce bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Успішно!</h3>
            <p className="text-gray-600">Пароль було успішно змінено</p>
          </div>
        </div>
      ) : (
        // Основна форма
        <div className={`modal-content ${isClosing ? 'closing' : ''} bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl transform transition-all duration-300`}>
          <div className="modal-header">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <span className="mr-2 text-2xl">
                  {isRequired ? '🔒' : '🔑'}
                </span>
                {isRequired ? 'Обов\'язкова зміна пароля' : 'Зміна пароля'}
              </h2>
              {!isRequired && (
                <button 
                  onClick={handleClose} 
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="modal-body">
            {isRequired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 animate-slideInLeft">
                <p className="text-sm text-yellow-800 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Ви використовуєте тимчасовий пароль. З міркувань безпеки необхідно змінити його на власний.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 animate-slideInLeft border-l-4 border-l-red-500">
                <p className="text-sm text-red-800 flex items-center">
                  <span className="mr-2">❌</span>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="animate-slideInUp" style={{animationDelay: '0.1s'}}>
                <label className="form-label flex items-center">
                  <span className="mr-2">🔐</span>
                  Поточний пароль
                </label>
                <input
                  type="password"
                  className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="animate-slideInUp" style={{animationDelay: '0.2s'}}>
                <label className="form-label flex items-center">
                  <span className="mr-2">🆕</span>
                  Новий пароль
                </label>
                <input
                  type="password"
                  className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                {newPassword && (
                  <div className="mt-2 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 password-strength-indicator ${
                            passwordStrength.color === 'red' ? 'password-strength-weak w-1/3' :
                            passwordStrength.color === 'yellow' ? 'password-strength-medium w-2/3' :
                            'password-strength-strong w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium transition-colors duration-300 flex items-center ${
                        passwordStrength.color === 'red' ? 'text-red-600' :
                        passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.color === 'red' && '🔴'}
                        {passwordStrength.color === 'yellow' && '🟡'}
                        {passwordStrength.color === 'green' && '🟢'}
                        <span className="ml-1">{passwordStrength.text}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-300">
                      <span className="mr-1">💡</span>
                      <strong>Рекомендації:</strong> мінімум 8 символів, великі та малі літери, цифри, спеціальні символи
                    </div>
                  </div>
                )}
              </div>

              <div className="animate-slideInUp" style={{animationDelay: '0.3s'}}>
                <label className="form-label flex items-center">
                  <span className="mr-2">✅</span>
                  Підтвердити новий пароль
                </label>
                <input
                  type="password"
                  className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="modal-footer">
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Змінюємо...
                      </span>
                    ) : '🔄 Змінити пароль'}
                  </button>
                  {!isRequired && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary transition-all duration-300 hover:scale-105"
                    >
                      Скасувати
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
