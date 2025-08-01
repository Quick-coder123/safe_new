'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import LoginForm from '@/components/LoginForm'
import Link from 'next/link'

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
}

interface ChangeLog {
  id: number
  table_name: string
  action: string
  old_values: any
  new_values: any
  created_at: string
}

interface Administrator {
  id: number
  login: string
  role: 'admin' | 'super_admin'
  is_temp_password: boolean
  created_at: string
  created_by: string
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
  })
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  
  // Стан для форми додавання адміністратора
  const [newAdminLogin, setNewAdminLogin] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin')
  
  // Стан для модального вікна зміни пароля
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Стан для модального вікна з новими credentials
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newCredentials, setNewCredentials] = useState({ login: '', password: '' })

  useEffect(() => {
    if (admin) {
      loadData()
      if (isSuperAdmin) {
        loadAdministrators()
      }
      // Показуємо модальне вікно зміни пароля, якщо пароль тимчасовий
      if (hasTempPassword) {
        setShowPasswordModal(true)
      }
    }
  }, [admin, isSuperAdmin, hasTempPassword])

  // Показуємо форму логіну, якщо користувач не авторизований
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return <LoginForm onSuccess={() => window.location.reload()} />
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const loadData = async () => {
    try {
      const response = await fetch('/api/get-settings')
      const data = await response.json()
      
      console.log('� Loaded data from get-settings:', data)
      
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

      // Завантаження журналу змін
      const { data: logs } = await supabase
        .from('change_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (logs) {
        setChangeLogs(logs)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const saveData = async () => {
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
      
      console.log('� Save response:', data)

      if (response.ok) {
        alert('Дані успішно збережені!')
        loadData() // Перезавантажуємо дані
      } else {
        alert('Помилка збереження даних: ' + (data.error || 'Невідома помилка'))
        console.error('Save error details:', data)
      }
    } catch (error) {
      console.error('Error saving data:', error)
      alert('Помилка збереження даних')
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

  const loadAdministrators = async () => {
    try {
      const response = await fetch('/api/administrators')

      if (response.ok) {
        const { administrators } = await response.json()
        console.log('� Loaded administrators:', administrators)
        setAdministrators(administrators)
      }
    } catch (error) {
      console.error('Error loading administrators:', error)
    }
  }

  const createAdministrator = async () => {
    if (!newAdminLogin.trim()) {
      alert('Введіть логін адміністратора')
      return
    }

    try {
      // Генеруємо тимчасовий пароль
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: newAdminLogin,
          password: tempPassword, // Передаємо plain пароль, хешування на сервері
          role: newAdminRole,
          is_temp_password: true
        }),
      })

      if (response.ok) {
        // Показуємо модальне вікно з credentials
        setNewCredentials({ login: newAdminLogin, password: tempPassword })
        setShowCredentialsModal(true)
        setNewAdminLogin('')
        setNewAdminRole('admin')
        loadAdministrators()
      } else {
        const { error } = await response.json()
        alert(`Помилка: ${error}`)
      }
    } catch (error) {
      console.error('Error creating administrator:', error)
      alert('Помилка створення адміністратора')
    }
  }

  const deleteAdministrator = async (administratorId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цього адміністратора?')) {
      return
    }

    try {
      const response = await fetch('/api/administrators', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ administratorId }),
      })

      if (response.ok) {
        alert('Адміністратора успішно видалено!')
        loadAdministrators()
      } else {
        const { error } = await response.json()
        alert(`Помилка: ${error}`)
      }
    } catch (error) {
      console.error('Error deleting administrator:', error)
      alert('Помилка видалення адміністратора')
    }
  }

  const updateAdministratorRole = async (administratorId: number, role: string) => {
    try {
      const response = await fetch(`/api/administrators/${administratorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ administratorId, role }),
      })

      if (response.ok) {
        alert('Роль адміністратора успішно оновлено!')
        loadAdministrators()
      } else {
        const { error } = await response.json()
        alert(`Помилка: ${error}`)
      }
    } catch (error) {
      console.error('Error updating administrator role:', error)
      alert('Помилка оновлення ролі')
    }
  }

  const resetAdministratorPassword = async (administratorId: number) => {
    if (!confirm('Ви впевнені, що хочете скинути пароль цього адміністратора?')) {
      return
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ administratorId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'Пароль успішно скинуто!')
        loadAdministrators()
      } else {
        const { error } = await response.json()
        alert(`Помилка: ${error}`)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Помилка скидання пароля')
    }
  }

  // Функції для копіювання credentials
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy: ', err)
      return false
    }
  }

  const copyLogin = async () => {
    const success = await copyToClipboard(newCredentials.login)
    if (success) {
      alert('Логін скопійовано до буферу обміну!')
    } else {
      alert('Помилка копіювання')
    }
  }

  const copyPassword = async () => {
    const success = await copyToClipboard(newCredentials.password)
    if (success) {
      alert('Пароль скопійовано до буферу обміну!')
    } else {
      alert('Помилка копіювання')
    }
  }

  const copyBoth = async () => {
    const both = `Логін: ${newCredentials.login}\nПароль: ${newCredentials.password}`
    const success = await copyToClipboard(both)
    if (success) {
      alert('Логін та пароль скопійовано до буферу обміну!')
    } else {
      alert('Помилка копіювання')
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🛠️ Адмін-панель</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary text-sm"
          >
            🔑 Змінити пароль
          </button>
          <Link 
            href="/"
            className="btn-secondary text-sm"
          >
            ← Повернутися до калькулятора
          </Link>
          <span className="text-gray-600">
            Вітаємо, {admin?.login}
            {hasTempPassword && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Тимчасовий пароль
              </span>
            )}
          </span>
          <button onClick={handleLogout} className="btn-secondary">
            Вийти
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'categories', name: 'Категорії сейфів' },
            { id: 'insurance', name: 'Страхування' },
            { id: 'settings', name: 'Налаштування' },
            ...(isSuperAdmin ? [{ id: 'administrators', name: 'Адміністратори' }] : []),
            { id: 'logs', name: 'Журнал змін' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Контент вкладок */}
      <div className="calculator-card">
        {activeTab === 'categories' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Тарифи за категоріями</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900 w-48 min-w-[12rem]">Категорія</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">до 30 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">31-90 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">91-180 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">181-365 днів</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900 w-48 min-w-[12rem]">
                        {category.name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                          value={category.rates.up_to_30}
                          onChange={(e) => updateCategory(category.id, 'up_to_30', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                          value={category.rates.from_31_to_90}
                          onChange={(e) => updateCategory(category.id, 'from_31_to_90', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                          value={category.rates.from_91_to_180}
                          onChange={(e) => updateCategory(category.id, 'from_91_to_180', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                          value={category.rates.from_181_to_365}
                          onChange={(e) => updateCategory(category.id, 'from_181_to_365', parseFloat(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Тарифи страхування ключа</h2>
            <div className="space-y-4">
              {insuranceRates.map((rate, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded">
                  <div>
                    <label className="form-label">Мін. днів</label>
                    <input
                      type="number"
                      className="form-input"
                      value={rate.min_days}
                      onChange={(e) => updateInsuranceRate(index, 'min_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Макс. днів</label>
                    <input
                      type="number"
                      className="form-input"
                      value={rate.max_days}
                      onChange={(e) => updateInsuranceRate(index, 'max_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Ціна (грн)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={rate.price}
                      onChange={(e) => updateInsuranceRate(index, 'price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Загальні налаштування</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Вартість довіреності (грн)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={settings.trust_document_price}
                    onChange={(e) => updateSetting('trust_document_price', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Вартість пакету (грн)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={settings.package_price}
                    onChange={(e) => updateSetting('package_price', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Грошове забезпечення (грн)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={settings.guarantee_amount}
                    onChange={(e) => updateSetting('guarantee_amount', e.target.value)}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Сума грошового забезпечення для нових договорів як альтернатива страхуванню ключа
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'administrators' && isSuperAdmin && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Управління адміністраторами</h2>
            
            {/* Форма додавання нового адміністратора */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">Додати нового адміністратора</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Логін</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newAdminLogin}
                    onChange={(e) => setNewAdminLogin(e.target.value)}
                    placeholder="admin_user"
                    pattern="[a-zA-Z0-9_-]+"
                    title="Логін може містити тільки букви, цифри, підкреслення та дефіси"
                  />
                </div>
                <div>
                  <label className="form-label">Роль</label>
                  <select
                    className="form-select"
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                  >
                    <option value="admin">Адміністратор</option>
                    <option value="super_admin">Супер-адміністратор</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createAdministrator}
                    className="btn-primary w-full"
                  >
                    Додати адміністратора
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p><strong>Адміністратор:</strong> може змінювати тарифи та бачити блок налаштувань реквізитів</p>
                <p><strong>Супер-адміністратор:</strong> має всі права адміністратора + може управляти іншими адміністраторами</p>
              </div>
            </div>

            {/* Список адміністраторів */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Логін</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Роль</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Статус пароля</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Створено</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Дії</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {administrators.map((adminItem) => (
                    <tr key={adminItem.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {adminItem.login}
                        {adminItem.id === admin?.adminId && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Ви</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <select
                          className="form-select text-sm"
                          value={adminItem.role}
                          onChange={(e) => updateAdministratorRole(adminItem.id, e.target.value)}
                          disabled={adminItem.id === admin?.adminId}
                        >
                          <option value="admin">Адміністратор</option>
                          <option value="super_admin">Супер-адміністратор</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {adminItem.is_temp_password ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Тимчасовий
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Власний
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        {new Date(adminItem.created_at).toLocaleDateString('uk-UA')}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="flex gap-2">
                          {adminItem.id !== admin?.adminId && (
                            <>
                              <button
                                onClick={() => resetAdministratorPassword(adminItem.id)}
                                className="btn-secondary text-xs"
                                title="Скинути пароль"
                              >
                                🔄 Скинути пароль
                              </button>
                              <button
                                onClick={() => deleteAdministrator(adminItem.id)}
                                className="btn-danger text-xs"
                              >
                                Видалити
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Журнал змін</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Дата/час</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Таблиця</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Дія</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Зміни</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {changeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString('uk-UA')}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">{log.table_name}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Деталі</summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify({ old: log.old_values, new: log.new_values }, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Кнопка збереження */}
        {activeTab !== 'logs' && activeTab !== 'administrators' && (
          <div className="mt-6">
            <button onClick={saveData} className="btn-primary">
              Зберегти зміни
            </button>
          </div>
        )}
      </div>

      {/* Модальне вікно зміни пароля */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isRequired={hasTempPassword}
      />

      {/* Модальне вікно з новими credentials */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-green-600">
                Адміністратора успішно створено!
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Логін:</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input 
                        type="text" 
                        value={newCredentials.login} 
                        readOnly 
                        className="flex-1 p-2 border rounded bg-white text-gray-900 font-mono"
                      />
                      <button
                        onClick={copyLogin}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        title="Копіювати логін"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Тимчасовий пароль:</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input 
                        type="text" 
                        value={newCredentials.password} 
                        readOnly 
                        className="flex-1 p-2 border rounded bg-white text-gray-900 font-mono"
                      />
                      <button
                        onClick={copyPassword}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        title="Копіювати пароль"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={copyBoth}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    📋 Копіювати обидва
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Важливо:</strong> Збережіть ці дані! Адміністратор повинен змінити пароль при першому вході.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
