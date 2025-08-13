
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import LoginForm from '@/components/LoginForm'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useNotification } from '@/components/Notification'
import CredentialsModal from '@/components/CredentialsModal'
import ResetPasswordModal from '@/components/ResetPasswordModal'
import Link from 'next/link'
import AdminSafes from './safes/page'

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
  // ...видалено журнал змін...
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  
  // Стан для форми додавання адміністратора
  const [newAdminLogin, setNewAdminLogin] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin')
  
  // Стан для модального вікна зміни пароля
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // Стан для модального вікна з новими credentials
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newCredentials, setNewCredentials] = useState({ login: '', password: '' })

  // Стан для модального вікна скидання пароля
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState({ login: '', password: '' })

  // Хуки для красивих діалогів
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog()
  const { showNotification, NotificationComponent } = useNotification()

  useEffect(() => {
    if (admin) {
      loadData()
      if (isSuperAdmin) {
        loadAdministrators()
      }
    }
  }, [admin, isSuperAdmin])

  // Показуємо форму логіну, якщо користувач не авторизований
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    )
  }

  if (!isAdmin) {
    // Перенаправляємо на головну сторінку, де буде можливість увійти через модальне вікно
    router.push('/')
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
      const response = await fetch('/api/get-settings-temp')
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

  // ...видалено завантаження журналу змін...
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const saveData = async () => {
    try {
      const response = await fetch('/api/save-settings-temp', {
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
        showNotification({
          title: 'Успіх!',
          message: 'Дані успішно збережені!',
          type: 'success'
        })
        loadData() // Перезавантажуємо дані
      } else {
        showNotification({
          title: 'Помилка збереження',
          message: data.error || 'Невідома помилка',
          type: 'error'
        })
        console.error('Save error details:', data)
      }
    } catch (error) {
      console.error('Error saving data:', error)
      showNotification({
        title: 'Помилка збереження',
        message: 'Не вдалося зберегти дані',
        type: 'error'
      })
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
      // ТИМЧАСОВО: Використовуємо temp endpoint без аутентифікації
      const response = await fetch('/api/administrators-temp')

      if (response.ok) {
        const { administrators } = await response.json()
        console.log('👥 Loaded administrators:', administrators)
        setAdministrators(administrators)
      }
    } catch (error) {
      console.error('Error loading administrators:', error)
    }
  }

  const createAdministrator = async () => {
    if (!newAdminLogin.trim()) {
      showNotification({
        title: 'Помилка',
        message: 'Введіть логін адміністратора',
        type: 'warning'
      })
      return
    }

    try {
      // Генеруємо тимчасовий пароль
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      const response = await fetch('/api/administrators-temp/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: newAdminLogin,
          password: tempPassword,
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
        showNotification({
          title: 'Помилка створення',
          message: error || 'Не вдалося створити адміністратора',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error creating administrator:', error)
      showNotification({
        title: 'Помилка створення',
        message: 'Не вдалося створити адміністратора',
        type: 'error'
      })
    }
  }

  const deleteAdministrator = async (administratorId: number) => {
    const confirmed = await showConfirm({
      title: 'Підтвердження видалення',
      message: 'Ви впевнені, що хочете видалити цього адміністратора? Ця дія не може бути скасована.',
      type: 'error',
      confirmText: 'Видалити',
      cancelText: 'Скасувати'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/administrators-temp/${administratorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        showNotification({
          title: 'Успіх!',
          message: 'Адміністратора успішно видалено!',
          type: 'success'
        })
        loadAdministrators()
      } else {
        const { error } = await response.json()
        showNotification({
          title: 'Помилка видалення',
          message: error || 'Не вдалося видалити адміністратора',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error deleting administrator:', error)
      showNotification({
        title: 'Помилка видалення',
        message: 'Не вдалося видалити адміністратора',
        type: 'error'
      })
    }
  }

  const updateAdministratorRole = async (administratorId: number, role: string) => {
    try {
      const response = await fetch(`/api/administrators-temp/${administratorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        showNotification({
          title: 'Успіх!',
          message: 'Роль адміністратора успішно оновлено!',
          type: 'success'
        })
        loadAdministrators()
      } else {
        const { error } = await response.json()
        showNotification({
          title: 'Помилка оновлення',
          message: error || 'Не вдалося оновити роль',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error updating administrator role:', error)
      showNotification({
        title: 'Помилка оновлення',
        message: 'Не вдалося оновити роль',
        type: 'error'
      })
    }
  }

  const resetAdministratorPassword = async (administratorId: number) => {
    const confirmed = await showConfirm({
      title: 'Підтвердження скидання пароля',
      message: 'Ви впевнені, що хочете скинути пароль цього адміністратора?',
      type: 'warning',
      confirmText: 'Скинути',
      cancelText: 'Скасувати'
    })

    if (!confirmed) return

    try {
      const response = await fetch('/api/reset-password-temp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ administratorId }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Знаходимо адміністратора за ID для отримання логіна
        const admin = administrators.find(a => a.id === administratorId)
        
        // Показуємо модальне вікно з новим паролем
        setResetPasswordData({ 
          login: admin?.login || 'Адміністратор', 
          password: result.temporaryPassword || '' 
        })
        setShowResetPasswordModal(true)
        
        loadAdministrators()
      } else {
        const { error } = await response.json()
        showNotification({
          title: 'Помилка скидання',
          message: error || 'Не вдалося скинути пароль',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      showNotification({
        title: 'Помилка скидання',
        message: 'Не вдалося скинути пароль',
        type: 'error'
      })
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
      showNotification({
        title: 'Скопійовано!',
        message: 'Логін скопійовано до буферу обміну!',
        type: 'success'
      })
    } else {
      showNotification({
        title: 'Помилка',
        message: 'Не вдалося скопіювати логін',
        type: 'error'
      })
    }
  }

  const copyPassword = async () => {
    const success = await copyToClipboard(newCredentials.password)
    if (success) {
      showNotification({
        title: 'Скопійовано!',
        message: 'Пароль скопійовано до буферу обміну!',
        type: 'success'
      })
    } else {
      showNotification({
        title: 'Помилка',
        message: 'Не вдалося скопіювати пароль',
        type: 'error'
      })
    }
  }

  const copyBoth = async () => {
    const both = `Логін: ${newCredentials.login}\nПароль: ${newCredentials.password}`
    const success = await copyToClipboard(both)
    if (success) {
      showNotification({
        title: 'Скопійовано!',
        message: 'Логін та пароль скопійовано до буферу обміну!',
        type: 'success'
      })
    } else {
      showNotification({
        title: 'Помилка',
        message: 'Не вдалося скопіювати дані',
        type: 'error'
      })
    }
  }

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(resetPasswordData.password)
    if (success) {
      showNotification({
        title: 'Скопійовано!',
        message: 'Новий пароль скопійовано до буферу обміну!',
        type: 'success'
      })
    } else {
      showNotification({
        title: 'Помилка',
        message: 'Не вдалося скопіювати пароль',
        type: 'error'
      })
    }
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
      <div className="border-b border-gray-200 animate-slideInUp">
        <nav className="-mb-px flex space-x-8">
          <div className="flex-1 flex space-x-8">
            {[
              { id: 'categories', name: 'Категорії сейфів', icon: '📁' },
              { id: 'insurance', name: 'Страхування', icon: '🛡️' },
              { id: 'settings', name: 'Налаштування', icon: '⚙️' },
              ...(isSuperAdmin ? [{ id: 'administrators', name: 'Адміністратори', icon: '👥' }] : []),
              // ...видалено вкладку журналу змін...
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 border-b-2 font-normal text-xs transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 whitespace-nowrap ${
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
              className={`py-2 px-3 border-b-2 font-normal text-xs transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center whitespace-nowrap ${
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
                className="py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200 flex items-center"
                style={{ textDecoration: 'none' }}
              >
                  <span className="mr-2"><i className="fa fa-lock"></i></span>🔄 Змінити пароль
              </button>
          </div>
  <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
        </nav>
      </div>

      {/* Контент вкладок */}
      <div className="calculator-card animate-slideInUp">
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
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  className="grid grid-cols-3 gap-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-all duration-300 animate-slideInUp bg-white"
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
                </div>
              ))}
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
          </div>
        )}

        {activeTab === 'administrators' && isSuperAdmin && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center animate-slideInLeft">
              <span className="mr-2">👥</span>
              Управління адміністраторами
            </h2>
            
            {/* Форма додавання нового адміністратора */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-6 shadow-md animate-slideInUp">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <span className="mr-2">➕</span>
                Додати нового адміністратора
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="animate-slideInUp" style={{animationDelay: '0.1s'}}>
                  <label className="form-label">Логін</label>
                  <input
                    type="text"
                    className="form-input transition-all duration-300 hover:scale-105 focus:scale-105"
                    value={newAdminLogin}
                    onChange={(e) => setNewAdminLogin(e.target.value)}
                    placeholder="admin_user"
                    pattern="[a-zA-Z0-9_-]+"
                    title="Логін може містити тільки букви, цифри, підкреслення та дефіси"
                  />
                </div>
                <div className="animate-slideInUp" style={{animationDelay: '0.2s'}}>
                  <label className="form-label">Роль</label>
                  <select
                    className="form-select animate-slideInUp transition-all duration-300 hover:scale-105 focus:scale-105"
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                  >
                    <option value="admin">Адміністратор</option>
                    <option value="super_admin">Супер-адміністратор</option>
                  </select>
                </div>
                <div className="flex items-end animate-slideInUp" style={{animationDelay: '0.3s'}}>
                  <button
                    onClick={createAdministrator}
                    className="btn-primary w-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
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
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg animate-slideInUp">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200 animate-slideInDown">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Логін</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Роль</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Статус пароля</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Створено</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Дії</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {administrators.map((adminItem, index) => (
                    <tr 
                      key={adminItem.id} 
                      className="hover:bg-blue-50 transition-all duration-300 animate-slideInUp"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
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
                                className="btn-secondary text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                                title="Скинути пароль"
                              >
                                🔄 Скинути пароль
                              </button>
                              <button
                                onClick={() => deleteAdministrator(adminItem.id)}
                                className="btn-danger text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                              >
                                🗑️ Видалити
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

  {/* ...видалено журнал змін... */}

        {/* Кнопка збереження */}
        {activeTab !== 'logs' && activeTab !== 'administrators' && (
          <div className="mt-6">
            <button onClick={saveData} className="btn-primary">
              Зберегти зміни
            </button>
          </div>
        )}
      </div>



      {/* Модальне вікно з новими credentials */}

      <CredentialsModal
        isOpen={showCredentialsModal}
        credentials={newCredentials}
        onClose={() => setShowCredentialsModal(false)}
        onCopy={(type) => {
          if (type === 'login') copyLogin()
          else if (type === 'password') copyPassword()
          else if (type === 'both') copyBoth()
        }}
      />

      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        adminLogin={resetPasswordData.login}
        newPassword={resetPasswordData.password}
        onClose={() => setShowResetPasswordModal(false)}
        onCopy={handleCopyPassword}
      />

      <ConfirmDialogComponent />
      <NotificationComponent />
    </div>
  )
}

