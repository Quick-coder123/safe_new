'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function DemoPage() {
  const [showWarning, setShowWarning] = useState(false)
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎭 Демонстрація анімацій діалогів підтвердження
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Warning Dialog */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 text-orange-800 flex items-center">
              <span className="mr-2">⚠️</span>
              Попередження
            </h3>
            <p className="text-gray-600 mb-4">
              Діалог для дій, які потребують підтвердження але не є критичними.
            </p>
            <button
              onClick={() => setShowWarning(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
            >
              Показати попередження
            </button>
          </div>

          {/* Error Dialog */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <h3 className="text-xl font-semibold mb-4 text-red-800 flex items-center">
              <span className="mr-2">🚨</span>
              Помилка
            </h3>
            <p className="text-gray-600 mb-4">
              Діалог для критичних дій, які не можна скасувати.
            </p>
            <button
              onClick={() => setShowError(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
            >
              Показати помилку
            </button>
          </div>

          {/* Success Dialog */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-4 text-green-800 flex items-center">
              <span className="mr-2">✅</span>
              Успіх
            </h3>
            <p className="text-gray-600 mb-4">
              Діалог для підтвердження успішних операцій.
            </p>
            <button
              onClick={() => setShowSuccess(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
            >
              Показати успіх
            </button>
          </div>

          {/* Info Dialog */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <span className="mr-2">ℹ️</span>
              Інформація
            </h3>
            <p className="text-gray-600 mb-4">
              Діалог для інформаційних повідомлень.
            </p>
            <button
              onClick={() => setShowInfo(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
            >
              Показати інформацію
            </button>
          </div>
        </div>

        {/* Animation Features */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            🎨 Особливості анімацій
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎭</div>
              <h4 className="font-semibold mb-2">Плавні переходи</h4>
              <p className="text-gray-600 text-sm">
                Елегантні cubic-bezier анімації для появи та зникнення
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="font-semibold mb-2">Інтерактивні ефекти</h4>
              <p className="text-gray-600 text-sm">
                Анімовані іконки, кнопки та hover ефекти
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold mb-2">Контекстні кольори</h4>
              <p className="text-gray-600 text-sm">
                Градієнти та кольори відповідно до типу повідомлення
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showWarning}
        type="warning"
        title="Підтвердження скидання пароля"
        message="Ви впевнені, що хочете скинути пароль цього адміністратора? Буде створено новий тимчасовий пароль."
        confirmText="Скинути"
        cancelText="Скасувати"
        onConfirm={() => {
          setShowWarning(false)
          alert('Пароль скинуто!')
        }}
        onCancel={() => setShowWarning(false)}
      />

      <ConfirmDialog
        isOpen={showError}
        type="error"
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цього адміністратора? Ця дія не може бути скасована."
        confirmText="Видалити"
        cancelText="Скасувати"
        onConfirm={() => {
          setShowError(false)
          alert('Адміністратора видалено!')
        }}
        onCancel={() => setShowError(false)}
      />

      <ConfirmDialog
        isOpen={showSuccess}
        type="success"
        title="Операція успішна"
        message="Всі дані були успішно збережені. Хочете продовжити роботу?"
        confirmText="Продовжити"
        cancelText="Завершити"
        onConfirm={() => {
          setShowSuccess(false)
          alert('Продовжуємо роботу!')
        }}
        onCancel={() => setShowSuccess(false)}
      />

      <ConfirmDialog
        isOpen={showInfo}
        type="info"
        title="Інформаційне повідомлення"
        message="Система буде оновлена до нової версії. Це займе приблизно 5 хвилин."
        confirmText="Зрозуміло"
        cancelText="Пізніше"
        onConfirm={() => {
          setShowInfo(false)
          alert('Розпочинаємо оновлення!')
        }}
        onCancel={() => setShowInfo(false)}
      />
    </div>
  )
}
