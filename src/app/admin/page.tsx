
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useNotification } from '@/components/Notification'
import { validateIban, validateEdrpou, normalizeIban } from '@/utils/validation'
import AdministratorsTab from './_components/AdministratorsTab'
import ChangeLogTab from './_components/ChangeLogTab'

interface SafeCategory {
  id: string
  name: string
  rates: {
    up_to_30: number
    from_31_to_90: number
    from_91_to_180: number
    from_181_to_365: number
  }
}

interface InsuranceRate {
  min_days: number
  max_days: number
  price: number
}

interface Settings {
  trust_document_price: string
  package_price: string
  guarantee_amount: string
  company_name: string
  company_edrpou: string
  company_iban: string
  payment_purpose: string
  insurance_payment_url: string
}


export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, isSuperAdmin, hasTempPassword, admin, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('categories')

  const [categories, setCategories] = useState<SafeCategory[]>([])
  const [insuranceRates, setInsuranceRates] = useState<InsuranceRate[]>([])
  const [settings, setSettings] = useState<Settings>({
    trust_document_price: '',
    package_price: '',
    guarantee_amount: '',
    company_name: '',
    company_edrpou: '',
    company_iban: '',
    payment_purpose: '',
    insurance_payment_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState({ id: '', name: '' })
  
  // Стан для модального вікна зміни пароля
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Хуки для красивих діалогів
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog()
  const { showNotification, NotificationComponent } = useNotification()

  useEffect(() => {
    if (admin && !hasTempPassword) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, hasTempPassword])

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/')
  }, [authLoading, isAdmin, router])


  // Показуємо форму логіну, якщо користувач не авторизований
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    )
  }

  if (!isAdmin) {
    // Перенаправлення на головну (див. useEffect вище), де можна увійти через модальне вікно
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Перенаправлення...</h2>
          <p className="text-gray-600">Ви будете перенаправлені на головну сторінку для входу</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const loadData = async () => {
    try {
      const response = await fetch('/api/get-settings', { cache: 'no-store' })
      const data = await response.json()

      if (data.categories) {
        const formattedCategories = data.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          rates: {
            up_to_30: cat.rate_up_to_30,
            from_31_to_90: cat.rate_31_to_90,
            from_91_to_180: cat.rate_91_to_180,
            from_181_to_365: cat.rate_181_to_365,
          }
        }))
        setCategories(formattedCategories)
      }
      
      if (data.insuranceRates) {
        setInsuranceRates(data.insuranceRates)
      }
      
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addCategory = () => {
    const id = newCategory.id.trim()
    const name = newCategory.name.trim()
    if (!id || !name) {
      showNotification({ title: 'Помилка', message: 'Вкажіть код і назву категорії', type: 'warning' })
      return
    }
    if (categories.some(c => c.id === id)) {
      showNotification({ title: 'Помилка', message: `Категорія з кодом "${id}" вже існує`, type: 'warning' })
      return
    }
    setCategories(prev => [...prev, {
      id, name, rates: { up_to_30: 0, from_31_to_90: 0, from_91_to_180: 0, from_181_to_365: 0 },
    }])
    setNewCategory({ id: '', name: '' })
  }

  const removeCategory = async (categoryId: string) => {
    const confirmed = await showConfirm({
      title: 'Видалити категорію?',
      message: 'Категорію буде видалено після натискання «Зберегти зміни».',
      type: 'warning',
      confirmText: 'Видалити',
      cancelText: 'Скасувати',
    })
    if (confirmed) setCategories(prev => prev.filter(c => c.id !== categoryId))
  }

  const addInsuranceRate = () => {
    const lastMax = insuranceRates.reduce((max, r) => Math.max(max, r.max_days), 0)
    setInsuranceRates(prev => [...prev, { min_days: lastMax + 1, max_days: Math.min(lastMax + 90, 365), price: 0 }])
  }

  const removeInsuranceRate = (index: number) => {
    setInsuranceRates(prev => prev.filter((_, i) => i !== index))
  }

  const saveData = async () => {
    if (settings.company_iban && !validateIban(settings.company_iban).valid) {
      setActiveTab('settings')
      showNotification({ title: 'Помилка', message: validateIban(settings.company_iban).error || 'Невірний IBAN', type: 'error' })
      return
    }
    if (settings.company_edrpou && !validateEdrpou(settings.company_edrpou).valid) {
      setActiveTab('settings')
      showNotification({ title: 'Помилка', message: validateEdrpou(settings.company_edrpou).error || 'Невірний ЄДРПОУ', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/save-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          insuranceRates,
          settings,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showNotification({
          title: 'Успіх!',
          message: 'Дані успішно збережені!',
          type: 'success'
        })
        loadData() // Перезавантажуємо дані
      } else {
        showNotification({
          title: 'Помилка збереження',
          message: Array.isArray(data.details) ? data.details.join('\n') : (data.error || 'Невідома помилка'),
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error saving data:', error)
      showNotification({
        title: 'Помилка збереження',
        message: 'Не вдалося зберегти дані',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = (categoryId: string, field: string, value: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, rates: { ...cat.rates, [field]: value } }
        : cat
    ))
  }

  const updateInsuranceRate = (index: number, field: string, value: number) => {
    setInsuranceRates(prev => prev.map((rate, i) => 
      i === index ? { ...rate, [field]: value } : rate
    ))
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Заголовок */}
      <div className="flex justify-between items-center animate-slideInUp">
        <h1 className="text-3xl font-bold text-gray-900 animate-pulse">🛠️ Адмін-панель</h1>
        <div className="flex items-center space-x-4">
          {/* Кнопка "Індивідуальні сейфи" тепер у вкладках */}
          {hasTempPassword && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded animate-bounce">
              Тимчасовий пароль
            </span>
          )}
        </div>
      </div>

      {/* Вкладки */}
  <div className="border-b border-gray-200 animate-slideInUp transition-all duration-500">
        <nav className="-mb-px flex space-x-8">
          <div className="flex-1 flex space-x-8">
            {[
              { id: 'categories', name: 'Категорії сейфів', icon: '📁' },
              { id: 'insurance', name: 'Страхування', icon: '🛡️' },
              { id: 'settings', name: 'Налаштування', icon: '⚙️' },
              ...(isSuperAdmin ? [{ id: 'administrators', name: 'Адміністратори', icon: '👥' }] : []),
              { id: 'logs', name: 'Журнал змін', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 font-normal text-xs transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-md'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
            <a
              href="/admin/safes"
              className={`py-2 px-3 border-b-2 font-normal text-xs transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 flex items-center whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                (typeof window !== 'undefined' && window.location.pathname === '/admin/safes')
                  ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-md'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
              style={{ textDecoration: 'none' }}
            >
              <span className="mr-2">🏧</span>Індивідуальні сейфи
            </a>
          </div>
          <div className="flex items-center ml-auto">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all duration-300 transform hover:scale-110 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ textDecoration: 'none' }}
              >
                  <span className="mr-2"><i className="fa fa-lock"></i></span>🔄 Змінити пароль
              </button>
          </div>
  <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
        </nav>
      </div>

      {/* Контент вкладок */}
      <div className="calculator-card transition-all duration-500 ease-in-out min-h-[300px] relative">
        <div key={activeTab} className="transition-all duration-500 ease-in-out animate-fadeIn">
        {activeTab === 'categories' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center animate-slideInLeft">
              <span className="mr-2">📁</span>
              Тарифи за категоріями
            </h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200 animate-slideInDown">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900 w-48 min-w-[12rem]">Категорія</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">до 30 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">31-90 днів</th>

                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">91-180 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">181-365 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900"></th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {categories.map((category, index) => (
                    <tr 
                      key={category.id} 
                      className="hover:bg-blue-50 transition-all duration-300 animate-slideInUp"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900 w-48 min-w-[12rem]">
                        {category.name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:scale-105 text-gray-900 bg-white hover:border-blue-300"
                          value={category.rates.up_to_30}
                          onChange={(e) => updateCategory(category.id, 'up_to_30', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:scale-105 text-gray-900 bg-white hover:border-blue-300"
                          value={category.rates.from_31_to_90}
                          onChange={(e) => updateCategory(category.id, 'from_31_to_90', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:scale-105 text-gray-900 bg-white hover:border-blue-300"
                          value={category.rates.from_91_to_180}
                          onChange={(e) => updateCategory(category.id, 'from_91_to_180', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:scale-105 text-gray-900 bg-white hover:border-blue-300"
                          value={category.rates.from_181_to_365}
                          onChange={(e) => updateCategory(category.id, 'from_181_to_365', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="btn-danger text-xs"
                          title="Видалити категорію"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="form-label">Код</label>
                <input
                  type="text"
                  className="form-input w-28"
                  placeholder="V"
                  maxLength={10}
                  value={newCategory.id}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, id: e.target.value }))}
                />
              </div>
              <div className="flex-1 min-w-[12rem]">
                <label className="form-label">Назва</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="V категорія"
                  maxLength={100}
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <button type="button" onClick={addCategory} className="btn-secondary">
                ➕ Додати категорію
              </button>
            </div>
          </div>
        )}
        {activeTab === 'insurance' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center animate-slideInLeft">
              <span className="mr-2">🛡️</span>
              Тарифи страхування ключа
            </h2>
            <div className="space-y-4">
              {insuranceRates.map((rate, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-all duration-300 animate-slideInUp bg-white"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div>
                    <label className="form-label">Мін. днів</label>
                    <input
                      type="number"
                      className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                      value={rate.min_days}
                      onChange={(e) => updateInsuranceRate(index, 'min_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Макс. днів</label>
                    <input
                      type="number"
                      className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                      value={rate.max_days}
                      onChange={(e) => updateInsuranceRate(index, 'max_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Ціна (грн)</label>
                    <input
                      type="number"
                      className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                      step="0.01"
                      value={rate.price}
                      onChange={(e) => updateInsuranceRate(index, 'price', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeInsuranceRate(index)} className="btn-danger text-xs w-full">
                      🗑️ Видалити
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addInsuranceRate} className="btn-secondary">
                ➕ Додати діапазон
              </button>
              <p className="text-sm text-gray-600">Діапазони не повинні перетинатися; максимальний термін — 365 днів.</p>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center animate-slideInLeft">
              <span className="mr-2">⚙️</span>
              Загальні налаштування
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 animate-slideInUp" style={{animationDelay: '0.1s'}}>
                <div className="form-group p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <label className="form-label flex items-center">
                    <span className="mr-2">📄</span>
                    Вартість довіреності (грн)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                    value={settings.trust_document_price}
                    onChange={(e) => updateSetting('trust_document_price', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4 animate-slideInUp" style={{animationDelay: '0.2s'}}>
                <div className="form-group p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <label className="form-label flex items-center">
                    <span className="mr-2">📦</span>
                    Вартість пакету (грн)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                    value={settings.package_price}
                    onChange={(e) => updateSetting('package_price', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4 animate-slideInUp" style={{animationDelay: '0.3s'}}>
                <div className="form-group p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <label className="form-label flex items-center">
                    <span className="mr-2">💰</span>
                    Грошове забезпечення (грн)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                    value={settings.guarantee_amount}
                    onChange={(e) => updateSetting('guarantee_amount', e.target.value)}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Сума грошового забезпечення для нових договорів як альтернатива страхуванню ключа
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4 flex items-center">
              <span className="mr-2">🏦</span>
              Реквізити для оплати
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Отримувач (назва / ПІБ)</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={200}
                  value={settings.company_name}
                  onChange={(e) => updateSetting('company_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Код ЄДРПОУ</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  maxLength={10}
                  placeholder="12345678"
                  value={settings.company_edrpou}
                  onChange={(e) => updateSetting('company_edrpou', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                {settings.company_edrpou && !validateEdrpou(settings.company_edrpou).valid && (
                  <p className="text-sm text-red-600 mt-1">{validateEdrpou(settings.company_edrpou).error}</p>
                )}
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">IBAN</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="UA213223130000026007233566001"
                  value={settings.company_iban}
                  onChange={(e) => updateSetting('company_iban', normalizeIban(e.target.value).slice(0, 29))}
                />
                {settings.company_iban && (
                  validateIban(settings.company_iban).valid
                    ? <p className="text-sm text-green-700 mt-1">✓ IBAN коректний</p>
                    : <p className="text-sm text-red-600 mt-1">{validateIban(settings.company_iban).error}</p>
                )}
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Призначення платежу</label>
                <textarea
                  className="form-input"
                  rows={2}
                  maxLength={500}
                  value={settings.payment_purpose}
                  onChange={(e) => updateSetting('payment_purpose', e.target.value)}
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Посилання для оплати страхування ключа</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={settings.insurance_payment_url}
                  onChange={(e) => updateSetting('insurance_payment_url', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'administrators' && isSuperAdmin && (
          <AdministratorsTab
            currentAdminId={admin?.adminId}
            showConfirm={showConfirm}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'logs' && <ChangeLogTab />}

        {/* Кнопка збереження */}
        {activeTab !== 'logs' && activeTab !== 'administrators' && (
          <div className="mt-6">
            <button onClick={saveData} className="btn-primary" disabled={saving}>
              {saving ? 'Збереження…' : 'Зберегти зміни'}
            </button>
          </div>
        )}
        </div>
      </div>



      <ConfirmDialogComponent />
      <NotificationComponent />
    </div>
  )
}

