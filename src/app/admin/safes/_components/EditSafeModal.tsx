'use client'

import React, { useState } from 'react';
import { Safe, CATEGORY_SIZES } from './types';

// Компонент для редагування сейфу
export default function EditSafeModal({ 
  safe, 
  onSafeUpdated, 
  onCancel,
  onMaintenanceRequested,
  onRestoreFromMaintenance,
  isSuperAdmin 
}: {
  safe: Safe;
  onSafeUpdated: () => void;
  onCancel: () => void;
  onMaintenanceRequested: (safeId: number) => void;
  onRestoreFromMaintenance: (safeId: number) => void;
  isSuperAdmin: boolean;
}) {
  const [number, setNumber] = useState(safe.number);
  const [category, setCategory] = useState(safe.category);
  const [size, setSize] = useState(safe.size);
  const [loading, setLoading] = useState(false);

  // Функція для оновлення розміру при зміні категорії
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Автоматично встановлюємо перший розмір нової категорії тільки якщо поточний розмір не підходить
    const availableSizes = CATEGORY_SIZES[newCategory as keyof typeof CATEGORY_SIZES];
    if (!availableSizes.includes(size)) {
      setSize(availableSizes[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    setLoading(true);
    try {
      // Відправити оновлення на сервер
      const response = await fetch(`/api/safes/${safe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: number.trim(),
          category,
          size
        }),
      });

      if (response.ok) {
        onSafeUpdated();
      } else {
        const error = await response.json();
        alert(`Помилка: ${error.error || 'Не вдалося оновити сейф'}`);
      }
    } catch (error) {
      alert('Помилка мережі');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Редагування чарунку № {safe.number}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="edit-number" className="block text-sm font-medium text-gray-700 mb-1">
              Номер чарунка
            </label>
            <input
              type="text"
              id="edit-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введіть номер сейфа"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
              Категорія
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="I">Категорія I</option>
              <option value="II">Категорія II</option>
              <option value="III">Категорія III</option>
              <option value="IV">Категорія IV</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="edit-size" className="block text-sm font-medium text-gray-700 mb-1">
              Розмір чарунка
            </label>
            <select
              id="edit-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORY_SIZES[category as keyof typeof CATEGORY_SIZES].map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}
                </option>
              ))}
            </select>
          </div>

          {/* Відображення коментаря для сейфів на обслуговуванні - тільки для супер-адміністратора */}
          {isSuperAdmin && safe.status === 'maintenance' && safe.maintenance_comment && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Коментар до обслуговування:
              </label>
              <p className="text-sm text-yellow-700">{safe.maintenance_comment}</p>
            </div>
          )}

          {/* Кнопка відновлення з обслуговування - тільки для супер-адміністратора */}
          {isSuperAdmin && safe.status === 'maintenance' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  onRestoreFromMaintenance(safe.id);
                  onCancel();
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Відновити чарунок (завершити обслуговування)
              </button>
            </div>
          )}

          {/* Кнопка на обслуговування - тільки для супер-адміністратора і якщо сейф не на обслуговуванні */}
          {isSuperAdmin && safe.status !== 'maintenance' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  onMaintenanceRequested(safe.id);
                  onCancel();
                }}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Відправити на обслуговування
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !number.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
