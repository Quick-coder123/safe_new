'use client'

import { useState } from 'react'

export interface CredentialsModalProps {
  isOpen: boolean
  credentials: {
    login: string
    password: string
  }
  onClose: () => void
  onCopy: (type: 'login' | 'password' | 'both') => void
}

export default function CredentialsModal({
  isOpen,
  credentials,
  onClose,
  onCopy
}: CredentialsModalProps) {
  if (!isOpen) return null

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200">
        {/* Header */}
        <div className="p-6 bg-green-50 border-b border-green-200 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <h3 className="text-lg font-semibold text-green-800">
              Адміністратора створено!
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Новий адміністратор успішно створений. Ось його дані для входу:
            </p>

            {/* Login */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логін:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={credentials.login}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={() => onCopy('login')}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  title="Копіювати логін"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тимчасовий пароль:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={credentials.password}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono"
                />
                <button
                  onClick={() => onCopy('password')}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  title="Копіювати пароль"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Copy Both Button */}
            <button
              onClick={() => onCopy('both')}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
            >
              📋 Копіювати логін та пароль
            </button>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">⚠️ Важливо:</span> Збережіть ці дані! 
                Адміністратор повинен змінити пароль при першому вході.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  )
}
