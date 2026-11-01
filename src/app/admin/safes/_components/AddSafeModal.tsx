'use client'

import React, { useState } from 'react';
import { Block, CATEGORY_SIZES } from './types';

// Компонент для додавання нового сейфа
export default function AddSafeModal({ blocks, onSafeAdded, onCancel }: {
  blocks: Block[];
  onSafeAdded: () => void;
  onCancel: () => void;
}) {
  const [number, setNumber] = useState('');
  const [category, setCategory] = useState('I');
  const [size, setSize] = useState(CATEGORY_SIZES['I'][0]);
  const [blockId, setBlockId] = useState<number>(blocks[0]?.id || 0);
  const [loading, setLoading] = useState(false);

  // Функція для оновлення розміру при зміні категорії
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Автоматично встановлюємо перший розмір нової категорії
    const availableSizes = CATEGORY_SIZES[newCategory as keyof typeof CATEGORY_SIZES];
    setSize(availableSizes[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/safes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: number.trim(),
          block_id: blockId,
          category,
          size: size // Використовуємо вибраний розмір
        }),
      });

      if (response.ok) {
        onSafeAdded();
      } else {
        const error = await response.json();
        alert(`Помилка: ${error.error || 'Не вдалося створити сейф'}`);
      }
    } catch (error) {
      alert('Помилка мережі');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="calculator-card w-full max-w-md transform transition-all duration-500 animate-slideInDown">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🔒 Додати новий сейф</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
              Номер сейфа
            </label>
            <input
              type="text"
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="form-input w-full"
              placeholder="Введіть номер сейфа"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="blockSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Блок
            </label>
            <select
              id="blockSelect"
              value={blockId}
              onChange={(e) => setBlockId(parseInt(e.target.value))}
              className="form-select w-full"
              required
            >
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} {block.description && `- ${block.description}`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Категорія
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select w-full"
            >
              <option value="I">Категорія I</option>
              <option value="II">Категорія II</option>
              <option value="III">Категорія III</option>
              <option value="IV">Категорія IV</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
              Розмір чарунка
            </label>
            <select
              id="size"
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

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-medium"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !number.trim()}
              className="flex-1 btn-primary btn-animated px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
            >
              {loading ? '⏳ Додавання...' : '✅ Додати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
