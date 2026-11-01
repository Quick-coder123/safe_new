'use client'

import React, { useState } from 'react';

// Компонент для додавання блоку
export default function AddBlockModal({ onBlockAdded, onCancel }: {
  onBlockAdded: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          description: description.trim() || undefined
        })
      });

      if (response.ok) {
        onBlockAdded();
        setName('');
        setDescription('');
      } else {
        const error = await response.json();
        alert(`Помилка: ${error.error || 'Не вдалося створити блок'}`);
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
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏢 Додати новий сейф</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="blockName" className="block text-sm font-medium text-gray-700 mb-2">
              Назва сейфу
            </label>
            <input
              type="text"
              id="blockName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full"
              placeholder="Введіть назву сейфу (наприклад: Сейф 01, Сейф 11)"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="blockDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Опис (необов&apos;язково)
            </label>
            <textarea
              id="blockDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input w-full resize-none"
              placeholder="Додатковий опис сейфу..."
              rows={3}
            />
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
              disabled={loading || !name.trim()}
              className="flex-1 btn-primary btn-animated px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
            >
              {loading ? '⏳ Створення...' : '✅ Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
