'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login: authLogin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Додаємо звуковий ефект спроби входу
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (error) {
        // звук не підтримується — ігноруємо
      }
    }

    const result = await authLogin(login, password)

    if (result.success) {
      // Звук успіху
      if (typeof window !== 'undefined') {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.1)
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        } catch (error) {
          // звук не підтримується — ігноруємо
        }
      }

      setShowSuccess(true)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          // Перенаправляємо на головну сторінку
          window.location.href = '/'
        }
      }, 1500)
    } else {
      // Звук помилки
      if (typeof window !== 'undefined') {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
          oscillator.type = 'sawtooth'
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.4)
        } catch (error) {
          // звук не підтримується — ігноруємо
        }
      }

      setError(result.error || 'Помилка авторизації')
      // Додаємо shake анімацію при помилці
      const modalElement = document.querySelector('.login-modal-content')
      if (modalElement) {
        modalElement.classList.add('shake')
        setTimeout(() => modalElement.classList.remove('shake'), 500)
      }
    }

    setLoading(false)
  }

  const handleAnimatedClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setShowSuccess(false)
      setLogin('')
      setPassword('')
      setError('')
      onClose()
    }, 300)
  }, [onClose])

  // Скидання станів при відкритті модального вікна
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setShowSuccess(false)
      setError('')
    }
  }, [isOpen])

  // Закриття по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleAnimatedClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleAnimatedClose])

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay ${isClosing ? 'closing' : ''}`}>
      {showSuccess ? (
        // Екран успіху
        <div className="login-modal-content bounce bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-3 animate-fadeIn">
              🎉 Вхід успішний!
            </h3>
            <p className="text-gray-600 mb-6 animate-slideInUp">
              Ласкаво просимо до адміністративної панелі!<br/>
              <span className="text-sm text-gray-500">Перенаправляємо на головну сторінку...</span>
            </p>
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <div className="absolute inset-0 rounded-full h-8 w-8 border-t-2 border-green-300 animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Основна форма входу
        <div className={`login-modal-content ${isClosing ? 'closing' : ''} bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300`}>
          {/* Header */}
          <div className="modal-header bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Вхід в систему</h2>
                  <p className="text-blue-100 text-sm">Адміністративна панель</p>
                </div>
              </div>
              <button 
                onClick={handleAnimatedClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-slideInLeft border-l-4 border-l-red-500">
                <p className="text-sm text-red-800 flex items-center">
                  <span className="mr-2">❌</span>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="animate-slideInUp" style={{animationDelay: '0.1s'}}>
                <label className="form-label flex items-center text-base font-medium text-gray-700">
                  <span className="mr-2">👤</span>
                  Логін
                </label>
                <input
                  type="text"
                  className="form-input transition-all duration-300 hover:scale-105 focus:scale-105 text-base"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Введіть ваш логін"
                  required
                  autoFocus
                />
              </div>

              <div className="animate-slideInUp" style={{animationDelay: '0.2s'}}>
                <label className="form-label flex items-center text-base font-medium text-gray-700">
                  <span className="mr-2">🔑</span>
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-12 transition-all duration-300 hover:scale-105 focus:scale-105 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введіть ваш пароль"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110"
                  >
                    <span className="text-lg">
                      {showPassword ? '🙈' : '👁️'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="modal-footer pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Авторизація...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">🚀</span>
                      Увійти
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Додаткова інформація */}
            <div className="mt-6 animate-fadeIn" style={{animationDelay: '0.4s'}}>
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Забули пароль? Зверніться до системного адміністратора
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
