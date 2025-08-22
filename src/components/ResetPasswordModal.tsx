'use client'

import { useState, useEffect } from 'react'

export interface ResetPasswordModalProps {
  isOpen: boolean
  adminLogin: string
  newPassword: string
  onClose: () => void
  onCopy: () => void
}

export default function ResetPasswordModal({
  isOpen,
  adminLogin,
  newPassword,
  onClose,
  onCopy
}: ResetPasswordModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAnimatedClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setCopied(false)
      onClose()
    }, 300)
  }

  const handleCopy = () => {
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  // Скидання станів при відкритті модального вікна
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setCopied(false)
    }
  }, [isOpen])
  if (!isOpen) return null

  return (
  <div className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`modal-content ${isClosing ? 'closing' : ''} bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300`}>
        {/* Header */}
        <div className="modal-header p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-2xl">🔑</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Пароль скинуто успішно!
              </h3>
              <p className="text-sm text-green-600">Новий тимчасовий пароль створено</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body p-6">
          <div className="space-y-4">
            <div className="animate-slideInLeft">
              <p className="text-gray-700 text-sm flex items-center">
                <span className="mr-2">👤</span>
                Пароль для адміністратора <strong className="text-blue-600">&ldquo;{adminLogin}&rdquo;</strong> успішно скинуто.
              </p>
            </div>

            {/* New Password */}
            <div className="animate-slideInUp bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border-2 border-dashed border-blue-300" style={{animationDelay: '0.2s'}}>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="mr-2">🔐</span>
                Новий тимчасовий пароль:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPassword}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border-2 border-blue-200 rounded-md text-base font-mono font-bold text-blue-900 text-center transition-all duration-300 hover:scale-105 focus:scale-105 shadow-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-md font-medium transition-all duration-300 transform hover:scale-105 ${
                    copied 
                      ? 'bg-green-500 text-white animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {copied ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Скопійовано!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      📋 Копіювати
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="animate-slideInRight bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4" style={{animationDelay: '0.4s'}}>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div>
                  <p className="text-sm text-yellow-800 font-medium flex items-center">
                    <span className="mr-2">🔐</span>
                    Важливо!
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Обов&apos;язково збережіть цей пароль і передайте його адміністратору. 
                    Адміністратор повинен змінити його при першому вході в систему.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="animate-slideInLeft bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4" style={{animationDelay: '0.6s'}}>
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Наступні кроки:
              </h4>
              <ol className="text-sm text-blue-700 space-y-2">
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                  Скопіюйте пароль вище
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                  Передайте його адміністратору <strong>&ldquo;{adminLogin}&rdquo;</strong>
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                  Адміністратор увійде з цим паролем
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
                  Система запропонує змінити пароль при першому вході
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 rounded-b-lg flex justify-end">
          <button
            onClick={handleAnimatedClose}
            className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-md hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-medium transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center">
              <span className="mr-2">✅</span>
              Зрозуміло
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
