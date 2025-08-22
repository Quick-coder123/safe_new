'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Safe {
  id: number;
  number: string;
  category: string;
  size: string;
  status: 'available' | 'occupied' | 'maintenance';
  block_id: number;
  maintenance_comment?: string;
}

interface Block {
  id: number;
  name: string;
  description?: string;
}

interface SafeStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  byCategory: {
    [key: string]: {
      total: number;
      available: number;
      occupied: number;
      maintenance: number;
      availableBySizes: {
        [size: string]: number;
      };
    };
  };
}

// Маппінг розмірів до категорій
const CATEGORY_SIZES = {
  'I': ['50х280х390', '75х280х390', '80х280х390', '100х280х390'],
  'II': ['125х280х390', '150х280х390'],
  'III': ['200х280х390', '250х280х390'],
  'IV': ['300х280х390']
};

// Компонент для додавання нового сейфа
function AddSafeModal({ blocks, onSafeAdded, onCancel }: {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
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
              Розмір сейфа
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

// Компонент для додавання блоку
function AddBlockModal({ onBlockAdded, onCancel }: {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="calculator-card w-full max-w-md transform transition-all duration-500 animate-slideInDown">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏢 Додати новий блок</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="blockName" className="block text-sm font-medium text-gray-700 mb-2">
              Назва блоку
            </label>
            <input
              type="text"
              id="blockName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full"
              placeholder="Введіть назву блоку (наприклад: Блок А, Корпус 1)"
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
              placeholder="Додатковий опис блоку..."
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

// Компонент для редагування сейфу
function EditSafeModal({ 
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

export default function SafesPage() {
  const { isSuperAdmin } = useAuth();
  const [safes, setSafes] = useState<Safe[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedSafe, setSelectedSafe] = useState<number | null>(null);
  const [showAddSafeModal, setShowAddSafeModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showEditSafeModal, setShowEditSafeModal] = useState(false);
  const [editingSafeData, setEditingSafeData] = useState<Safe | null>(null);
  const [maintenanceComment, setMaintenanceComment] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceSafeId, setMaintenanceSafeId] = useState<number | null>(null);
  const [stats, setStats] = useState<SafeStats>({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    byCategory: {}
  });

  const loadData = useCallback(async () => {
    try {
      // Завантажуємо блоки
      const blocksResponse = await fetch('/api/blocks');
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        setBlocks(blocksData);
      }

      // Завантажуємо сейфи
      const safesResponse = await fetch('/api/safes');
      if (safesResponse.ok) {
        const safesData = await safesResponse.json();
        // Конвертуємо дані з бази до нашого інтерфейсу
        const convertedSafes = safesData.safes?.map((safe: any) => ({
          id: safe.id,
          number: safe.number,
          category: safe.category || 'I',
          size: safe.size || getSizeForCategory(safe.category || 'I'), // Використовуємо реальний розмір з БД
          status: safe.maintenance_status ? 'maintenance' : (safe.is_occupied ? 'occupied' : 'available'),
          block_id: safe.block_id,
          maintenance_comment: safe.maintenance_comment
        })) || [];
        setSafes(convertedSafes);
      } else {
        // Якщо API не працює, використовуємо тестові дані
        loadTestData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      loadTestData();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTestData = () => {
    const testBlocks: Block[] = [
      { id: 1, name: 'Блок A', description: 'Перший блок сейфів' },
      { id: 2, name: 'Блок B', description: 'Другий блок сейфів' },
      { id: 3, name: 'Блок C', description: 'Третій блок сейфів' }
    ];

    const testSafes: Safe[] = [
      // Блок A
      { id: 1, number: 'A001', category: 'I', size: '50х280х390', status: 'available', block_id: 1 },
      { id: 2, number: 'A002', category: 'I', size: '75х280х390', status: 'occupied', block_id: 1 },
      { id: 3, number: 'A003', category: 'II', size: '125х280х390', status: 'available', block_id: 1 },
      { id: 4, number: 'A004', category: 'II', size: '150х280х390', status: 'maintenance', block_id: 1, maintenance_comment: 'Потрібна заміна замка' },
      { id: 5, number: 'A005', category: 'III', size: '200х280х390', status: 'occupied', block_id: 1 },
      { id: 6, number: 'A006', category: 'III', size: '250х280х390', status: 'available', block_id: 1 },
      { id: 7, number: 'A007', category: 'IV', size: '300х280х390', status: 'available', block_id: 1 },
      
      // Блок B
      { id: 8, number: 'B001', category: 'I', size: '80х280х390', status: 'available', block_id: 2 },
      { id: 9, number: 'B002', category: 'I', size: '100х280х390', status: 'occupied', block_id: 2 },
      { id: 10, number: 'B003', category: 'II', size: '125х280х390', status: 'available', block_id: 2 },
      { id: 11, number: 'B004', category: 'III', size: '200х280х390', status: 'maintenance', block_id: 2, maintenance_comment: 'Планове технічне обслуговування системи відкриття' },
      { id: 12, number: 'B005', category: 'IV', size: '300х280х390', status: 'occupied', block_id: 2 },
      
      // Блок C
      { id: 13, number: 'C001', category: 'I', size: '50х280х390', status: 'available', block_id: 3 },
      { id: 14, number: 'C002', category: 'II', size: '150х280х390', status: 'available', block_id: 3 },
      { id: 15, number: 'C003', category: 'III', size: '250х280х390', status: 'occupied', block_id: 3 }
    ];

    setBlocks(testBlocks);
    setSafes(testSafes);
  };

  const getSizeForCategory = (category: string): string => {
    const sizes = CATEGORY_SIZES[category as keyof typeof CATEGORY_SIZES];
    return sizes ? sizes[0] : '50х280х390';
  };

  const calculateStats = useCallback(() => {
    const total = safes.length;
    const available = safes.filter(s => s.status === 'available').length;
    const occupied = safes.filter(s => s.status === 'occupied').length;
    const maintenance = isSuperAdmin ? safes.filter(s => s.status === 'maintenance').length : 0;

    const byCategory: SafeStats['byCategory'] = {};
    
    ['I', 'II', 'III', 'IV'].forEach(category => {
      const categorySafes = safes.filter(s => s.category === category);
      const availableSafes = categorySafes.filter(s => s.status === 'available');
      
      // Підраховуємо вільні сейфи по розмірах
      const availableBySizes: { [size: string]: number } = {};
      availableSafes.forEach(safe => {
        const size = safe.size;
        availableBySizes[size] = (availableBySizes[size] || 0) + 1;
      });
      
      byCategory[category] = {
        total: categorySafes.length,
        available: availableSafes.length,
        occupied: categorySafes.filter(s => s.status === 'occupied').length,
        maintenance: isSuperAdmin ? categorySafes.filter(s => s.status === 'maintenance').length : 0,
        availableBySizes
      };
    });

    setStats({ total, available, occupied, maintenance, byCategory });
  }, [safes, isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const toggleSafeStatus = async (safeId: number) => {
    if (!isSuperAdmin) {
      alert('Тільки супер-адміністратор може змінювати статус сейфів');
      return;
    }

    const safe = safes.find(s => s.id === safeId);
    if (!safe) return;

    // Якщо сейф на обслуговуванні, не дозволяємо змінювати стан
    if (safe.status === 'maintenance') return;

    let newStatus: Safe['status'];
    // Тільки перемикання між вільний/зайнятий
    switch (safe.status) {
      case 'available':
        newStatus = 'occupied';
        break;
      case 'occupied':
        newStatus = 'available';
        break;
      default:
        return;
    }

    // Оновлюємо локально для миттєвої реакції UI
    setSafes(safes.map(s => 
      s.id === safeId ? { ...s, status: newStatus } : s
    ));

    // Відправляємо на сервер
    try {
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_occupied: newStatus === 'occupied' })
      });

      if (!response.ok) {
        throw new Error('Failed to update safe status');
      }
    } catch (error) {
      console.error('Error updating safe status:', error);
      // Відкатуємо зміни при помилці
      setSafes(safes.map(s => 
        s.id === safeId ? { ...s, status: safe.status } : s
      ));
      alert('Помилка при оновленні статусу сейфа');
    }
  };

  const deleteSafe = async (safeId: number) => {
    const safe = safes.find(s => s.id === safeId);
    if (!safe) return;

    const confirmMessage = `Ви дійсно хочете видалити сейф ${safe.number}?\nЦю дію неможливо скасувати.`;
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Помилка видалення сейфа');
      }

      // Оновлюємо локальний стан
      setSafes(safes.filter(s => s.id !== safeId));
      
      // Якщо видаляємо поточно вибраний сейф, очищуємо вибір
      if (selectedSafe === safeId) {
        setSelectedSafe(null);
      }

      alert('Сейф успішно видалено');
    } catch (error) {
      console.error('Error deleting safe:', error);
      alert(`Помилка: ${error instanceof Error ? error.message : 'Не вдалося видалити сейф'}`);
    }
  };

  const deleteBlock = async (blockId: number) => {
    if (!isSuperAdmin) {
      alert('Тільки супер-адміністратор може видаляти блоки');
      return;
    }

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Перевіряємо чи є сейфи в блоці
    const blockSafes = safes.filter(s => s.block_id === blockId);
    if (blockSafes.length > 0) {
      alert(`Неможливо видалити блок "${block.name}" - в ньому є сейфи. Спочатку видаліть або перемістіть всі сейфи з цього блоку.`);
      return;
    }

    const confirmMessage = `Ви дійсно хочете видалити блок "${block.name}"?\nЦю дію неможливо скасувати.`;
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Помилка видалення блоку');
      }

      // Оновлюємо локальний стан
      setBlocks(blocks.filter(b => b.id !== blockId));
      
      // Якщо видаляємо поточно вибраний блок, очищуємо вибір
      if (selectedBlock === blockId) {
        setSelectedBlock(null);
      }

      alert('Блок успішно видалено');
    } catch (error) {
      console.error('Error deleting block:', error);
      alert(`Помилка: ${error instanceof Error ? error.message : 'Не вдалося видалити блок'}`);
    }
  };

  const setMaintenanceStatus = async (safeId: number, comment: string) => {
    if (!isSuperAdmin) {
      alert('Тільки супер-адміністратор може відправляти сейфи на обслуговування');
      return;
    }

    // Оновлюємо локально для миттєвої реакції UI
    setSafes(safes.map(s => 
      s.id === safeId ? { ...s, status: 'maintenance', maintenance_comment: comment } : s
    ));

    // Відправляємо на сервер
    try {
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          maintenance_status: true,
          maintenance_comment: comment,
          is_occupied: false // Сейф на обслуговуванні не зайнятий
        })
      });

      if (!response.ok) {
        throw new Error('Failed to set maintenance status');
      }
    } catch (error) {
      console.error('Error setting maintenance status:', error);
      alert('Помилка при встановленні статусу обслуговування');
      
      // Відкочуємо зміни при помилці
      const originalSafe = safes.find(s => s.id === safeId);
      if (originalSafe) {
        setSafes(safes.map(s => 
          s.id === safeId ? { ...originalSafe } : s
        ));
      }
    }
  };

  const restoreFromMaintenance = async (safeId: number) => {
    if (!isSuperAdmin) {
      alert('Тільки супер-адміністратор може відновлювати сейфи з обслуговування');
      return;
    }

    // Оновлюємо локально для миттєвої реакції UI
    setSafes(safes.map(s => 
      s.id === safeId ? { ...s, status: 'available', maintenance_comment: undefined } : s
    ));

    // Відправляємо на сервер
    try {
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          maintenance_status: false,
          maintenance_comment: null,
          is_occupied: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restore from maintenance');
      }
    } catch (error) {
      console.error('Error restoring from maintenance:', error);
      alert('Помилка при відновленні з обслуговування');
      
      // Відкочуємо зміни при помилці
      const originalSafe = safes.find(s => s.id === safeId);
      if (originalSafe) {
        setSafes(safes.map(s => 
          s.id === safeId ? { ...originalSafe } : s
        ));
      }
    }
  };

  const updateSafeSize = async (safeId: number, newSize: string) => {
    if (!isSuperAdmin) {
      alert('Тільки супер-адміністратор може редагувати сейфи');
      return;
    }

    // Знаходимо поточний сейф
    const currentSafe = safes.find(s => s.id === safeId);
    if (!currentSafe) return;

    // Оновлюємо локально для миттєвої реакції UI
    setSafes(safes.map(s => 
      s.id === safeId ? { ...s, size: newSize } : s
    ));

    // Відправляємо на сервер
    try {
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          size: newSize
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update safe size');
      }
    } catch (error) {
      console.error('Error updating safe size:', error);
      alert('Помилка при оновленні розміру сейфа');
      
      // Відкочуємо зміни при помилці
      setSafes(safes.map(s => 
        s.id === safeId ? { ...s, size: currentSafe.size } : s
      ));
    }
  };

  const getStatusColor = (status: Safe['status']) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 hover:from-green-200 hover:to-emerald-200 cursor-pointer btn-animated';
      case 'occupied':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300 hover:from-red-200 hover:to-pink-200 cursor-pointer btn-animated';
      case 'maintenance':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 hover:from-yellow-200 hover:to-amber-200 cursor-pointer btn-animated';
    }
  };

  const getStatusText = (status: Safe['status']) => {
    switch (status) {
      case 'available':
        return '✅ Вільний';
      case 'occupied':
        return '🔒 Зайнятий';
      case 'maintenance':
        return '🔧 На обслуговуванні';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'I':
        return 'bg-blue-100 text-blue-800';
      case 'II':
        return 'bg-purple-100 text-purple-800';
      case 'III':
        return 'bg-orange-100 text-orange-800';
      case 'IV':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSafes = selectedBlock 
    ? safes.filter(safe => safe.block_id === selectedBlock)
    : [];

  // Функція для створення вертикального розташування в двох колонках
  const createVerticalLayout = (safes: Safe[]) => {
    const sortedSafes = [...safes].sort((a, b) => a.number.localeCompare(b.number));
    const totalSafes = sortedSafes.length;
    const leftColumnCount = Math.ceil(totalSafes / 2);
    
    const leftColumn = sortedSafes.slice(0, leftColumnCount);
    const rightColumn = sortedSafes.slice(leftColumnCount);
    
    // Створюємо масив для відображення: спочатку всі з лівої колонки, потім всі з правої
    const verticalLayout = [];
    
    // Додаємо сейфи з лівої колонки
    for (let i = 0; i < leftColumn.length; i++) {
      verticalLayout.push({ ...leftColumn[i], columnIndex: 0, rowIndex: i });
    }
    
    // Додаємо сейфи з правої колонки
    for (let i = 0; i < rightColumn.length; i++) {
      verticalLayout.push({ ...rightColumn[i], columnIndex: 1, rowIndex: i });
    }
    
    return verticalLayout;
  };

  const layoutSafes = createVerticalLayout(filteredSafes);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження сейфів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn p-6">
        {/* Заголовок */}
        <div className="text-center transform transition-all duration-1000 animate-slideInDown mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🔐 Керування сейфами</h1>
          <p className="text-lg text-gray-600">Перегляд та управління сейфами та чарунками</p>
        </div>

        {/* Статистика */}
        {/* Статистика */}
        <div className={`grid gap-6 mb-8 transform transition-all duration-1000 animate-slideInLeft ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div className="calculator-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Всього чарунків</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <div className="mt-2 text-blue-500">📊</div>
            </div>
          </div>
          <div className="calculator-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Вільні</h3>
              <p className="text-3xl font-bold text-green-600">{stats.available}</p>
              <div className="mt-2 text-green-500">✅</div>
            </div>
          </div>
          <div className="calculator-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Зайняті</h3>
              <p className="text-3xl font-bold text-red-600">{stats.occupied}</p>
              <div className="mt-2 text-red-500">🔒</div>
            </div>
          </div>
          {isSuperAdmin && (
            <div className="calculator-card hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-2">На обслуговуванні</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.maintenance}</p>
                <div className="mt-2 text-yellow-500">🔧</div>
              </div>
            </div>
          )}
        </div>

        {/* Статистика по категоріях */}
        <div className="calculator-card transform transition-all duration-1000 animate-slideInUp mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">📈 Статистика по категоріях</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(stats.byCategory).map(([category, data], index) => (
              <div 
                key={category} 
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-bold text-lg mb-4 text-center text-indigo-600">{category} категорія</h3>
                
                {/* Загальна статистика */}
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Всього:</span>
                    <span className="font-medium">{data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Зайняті:</span>
                    <span className="font-medium text-red-600">{data.occupied}</span>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex justify-between">
                      <span>На обслуговуванні:</span>
                      <span className="font-medium text-yellow-600">{data.maintenance}</span>
                    </div>
                  )}
                </div>

                {/* Детальна інформація про вільні сейфи по розмірах */}
                {data.available > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-green-700 mb-2">
                      Вільні чарунки по розмірах:
                    </h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(data.availableBySizes).map(([size, count]) => (
                        <div key={size} className="flex justify-between">
                          <span className="text-gray-600">{size}:</span>
                          <span className="font-medium text-green-600">{count} шт</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.available === 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 italic">Немає вільних сейфів</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Сейфи на обслуговуванні - тільки для супер-адміністратора */}
        {isSuperAdmin && safes.filter(safe => safe.status === 'maintenance').length > 0 && (
          <div className="calculator-card transform transition-all duration-1000 animate-slideInUp mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">🔧 Чарунки на обслуговуванні</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safes
                .filter(safe => safe.status === 'maintenance')
                .map((safe, index) => {
                  const block = blocks.find(b => b.id === safe.block_id);
                  return (
                    <div 
                      key={safe.id} 
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-xl text-yellow-800">
                          🔒 {safe.number}
                        </h3>
                        <span className="text-xs text-yellow-700 bg-yellow-200 px-3 py-1 rounded-full font-medium">
                          {block?.name}
                        </span>
                      </div>
                      
                      <div className="text-sm text-yellow-700 mb-2">
                        <div>Категорія: {safe.category}</div>
                        <div>Розмір: {safe.size}</div>
                      </div>

                      {safe.maintenance_comment && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-yellow-800 mb-1">
                            Коментар:
                          </label>
                          <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded border italic">
                            {safe.maintenance_comment}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingSafeData(safe);
                            setShowEditSafeModal(true);
                          }}
                          className="flex-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Редагувати
                        </button>
                        <button
                          onClick={() => restoreFromMaintenance(safe.id)}
                          className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Відновити
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Вибір сейфу */}
        <div className="calculator-card transform transition-all duration-1000 animate-slideInRight mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">🏢 Вибір сейфу</h2>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddBlockModal(true)}
                className="btn-primary btn-animated flex items-center gap-2 px-4 py-2 text-sm transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Додати новий сейф
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocks.map((block, index) => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 btn-animated text-left ${
                  selectedBlock === block.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">🏢 {block.name}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {safes.filter(s => s.block_id === block.id).length} сейфів
                  </span>
                </div>
                {block.description && (
                  <div className="text-xs opacity-75 mt-1">
                    {block.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Сейфи блоку */}
        <div className="calculator-card transform transition-all duration-1000 animate-slideInUp">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              🔒 {selectedBlock ? ` ${blocks.find(b => b.id === selectedBlock)?.name}` : 'Оберіть сейф для перегляду чарунків'}
            </h2>
            {isSuperAdmin && selectedBlock && (
              <button
                onClick={() => setShowAddSafeModal(true)}
                className="btn-primary btn-animated flex items-center gap-2 px-4 py-2 text-sm transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Додати чарунок
              </button>
            )}
          </div>
          
          {layoutSafes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">Оберіть сейф зі списку вище для перегляду чарунків</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Ліва колонка */}
              <div className="space-y-6">
                {layoutSafes.filter(safe => safe.columnIndex === 0).map((safe, index) => {
                  const block = blocks.find(b => b.id === safe.block_id);
                  return (
                    <div
                      key={safe.id}
                      className="bg-gradient-to-r from-white to-gray-50 border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slideInLeft"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-2xl text-indigo-600">🔒 {safe.number}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(safe.category)}`}>
                          {safe.category} категорія
                        </span>
                      </div>
                      
                      <div className="mb-4 text-sm text-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">📏 Розмір: {safe.size}</span>
                          {isSuperAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSafeData(safe);
                                  setShowEditSafeModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1 rounded-lg transition-colors hover:bg-blue-100"
                              >
                                ✏️ Редагувати
                              </button>
                              <button
                                onClick={() => deleteSafe(safe.id)}
                                className="text-red-600 hover:text-red-800 text-sm bg-red-50 px-3 py-1 rounded-lg transition-colors hover:bg-red-100"
                              >
                                🗑️ Видалити
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {safe.status === 'maintenance' ? (
                          <div className="text-center">
                            {isSuperAdmin ? (
                              <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                                На обслуговуванні
                              </div>
                            ) : (
                              <div className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                Недоступний
                              </div>
                            )}
                          </div>
                        ) : (
                          isSuperAdmin ? (
                            <button
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${getStatusColor(safe.status)}`}
                              onClick={() => toggleSafeStatus(safe.id)}
                            >
                              {getStatusText(safe.status)}
                            </button>
                          ) : (
                            <div className={`w-full px-3 py-2 rounded-lg text-sm font-medium border text-center ${getStatusColor(safe.status).replace('hover:', '').replace('cursor-pointer', '')}`}>
                              {getStatusText(safe.status)}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Права колонка */}
              <div className="space-y-6">
                {layoutSafes.filter(safe => safe.columnIndex === 1).map((safe, index) => {
                  const block = blocks.find(b => b.id === safe.block_id);
                  return (
                    <div
                      key={safe.id}
                      className="bg-gradient-to-l from-white to-gray-50 border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slideInRight"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-2xl text-indigo-600">🔒 {safe.number}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(safe.category)}`}>
                          {safe.category} категорія
                        </span>
                      </div>
                      
                      <div className="mb-4 text-sm text-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">📏 Розмір: {safe.size}</span>
                          {isSuperAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSafeData(safe);
                                  setShowEditSafeModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1 rounded-lg transition-colors hover:bg-blue-100"
                              >
                                ✏️ Редагувати
                              </button>
                              <button
                                onClick={() => deleteSafe(safe.id)}
                                className="text-red-600 hover:text-red-800 text-sm bg-red-50 px-3 py-1 rounded-lg transition-colors hover:bg-red-100"
                              >
                                🗑️ Видалити
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {safe.status === 'maintenance' ? (
                          <div className="text-center">
                            {isSuperAdmin ? (
                              <div className="px-4 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-xl text-sm font-medium">
                                🔧 На обслуговуванні
                              </div>
                            ) : (
                              <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-xl text-sm font-medium">
                                ❌ Недоступний
                              </div>
                            )}
                          </div>
                        ) : (
                          isSuperAdmin ? (
                            <button
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${getStatusColor(safe.status)}`}
                              onClick={() => toggleSafeStatus(safe.id)}
                            >
                              {getStatusText(safe.status)}
                            </button>
                          ) : (
                            <div className={`w-full px-3 py-2 rounded-lg text-sm font-medium border text-center ${getStatusColor(safe.status).replace('hover:', '').replace('cursor-pointer', '')}`}>
                              {getStatusText(safe.status)}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальне вікно для додавання сейфа */}
      {showAddSafeModal && (
        <AddSafeModal 
          blocks={blocks.filter(b => b.id === selectedBlock)}
          onSafeAdded={() => {
            setShowAddSafeModal(false);
            loadData();
          }}
          onCancel={() => setShowAddSafeModal(false)}
        />
      )}

      {/* Модальне вікно для додавання блоку */}
      {showAddBlockModal && (
        <AddBlockModal 
          onBlockAdded={() => {
            setShowAddBlockModal(false);
            loadData();
          }}
          onCancel={() => setShowAddBlockModal(false)}
        />
      )}

      {/* Модальне вікно для коментаря обслуговування */}
      {showMaintenanceModal && maintenanceSafeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Коментар для обслуговування
            </h3>
            
            <div className="mb-4">
              <label htmlFor="maintenance-comment" className="block text-sm font-medium text-gray-700 mb-1">
                Причина обслуговування (обов&apos;язково)
              </label>
              <textarea
                id="maintenance-comment"
                value={maintenanceComment}
                onChange={(e) => setMaintenanceComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Опишіть причину обслуговування..."
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setMaintenanceComment('');
                  setMaintenanceSafeId(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={!maintenanceComment.trim()}
                onClick={() => {
                  if (maintenanceComment.trim() && maintenanceSafeId) {
                    setMaintenanceStatus(maintenanceSafeId, maintenanceComment.trim());
                    setShowMaintenanceModal(false);
                    setMaintenanceComment('');
                    setMaintenanceSafeId(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно для редагування сейфу */}
      {showEditSafeModal && editingSafeData && (
        <EditSafeModal
          safe={editingSafeData}
          onSafeUpdated={() => {
            // Просто перезавантажуємо дані з сервера
            setShowEditSafeModal(false);
            setEditingSafeData(null);
            loadData(); // Перезавантажуємо дані
          }}
          onCancel={() => {
            setShowEditSafeModal(false);
            setEditingSafeData(null);
          }}
          onMaintenanceRequested={(safeId) => {
            setMaintenanceSafeId(safeId);
            setShowMaintenanceModal(true);
          }}
          onRestoreFromMaintenance={restoreFromMaintenance}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}
