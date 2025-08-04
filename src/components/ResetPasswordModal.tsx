'use client'

import { useState } from 'react'

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
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200">
        {/* Header */}
        <div className="p-6 bg-blue-50 border-b border-blue-200 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔑</span>
            <h3 className="text-lg font-semibold text-blue-800">
              Пароль скинуто успішно!
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Пароль для адміністратора <strong>"{adminLogin}"</strong> успішно скинуто.
            </p>

            {/* New Password */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новий тимчасовий пароль:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPassword}
                  readOnly
                  className="flex-1 px-3 py-3 bg-white border-2 border-blue-200 rounded-md text-base font-mono font-bold text-blue-900 text-center"
                />
                <button
                  onClick={onCopy}
                  className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  title="Копіювати пароль"
                >
                  📋 Копіювати
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    Важливо!
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Обов'язково збережіть цей пароль і передайте його адміністратору. 
                    Адміністратор повинен змінити його при першому вході в систему.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Наступні кроки:
              </h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Скопіюйте пароль вище</li>
                <li>2. Передайте його адміністратору "{adminLogin}"</li>
                <li>3. Адміністратор увійде з цим паролем</li>
                <li>4. Система запропонує змінити пароль при першому вході</li>
              </ol>
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
