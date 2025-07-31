'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type User } from '@supabase/supabase-js'

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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('categories')

  const [categories, setCategories] = useState<SafeCategory[]>([])
  const [insuranceRates, setInsuranceRates] = useState<InsuranceRate[]>([])
  const [settings, setSettings] = useState<Settings>({
    trust_document_price: '300',
    package_price: '50',
    guarantee_amount: '5000',
  })
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Помилка входу: ' + error.message)
    } else {
      setUser(data.user)
    }
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const loadData = async () => {
    try {
      const response = await fetch('/api/get-settings')
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Помилка авторизації')
        return
      }

      const response = await fetch('/api/save-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          categories,
          insuranceRates,
          settings,
        }),
      })

      if (response.ok) {
        alert('Дані успішно збережені!')
        loadData() // Перезавантажуємо дані
      } else {
        alert('Помилка збереження даних')
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

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="calculator-card">
          <h1 className="text-2xl font-bold mb-6 text-center">🔐 Авторизація адміністратора</h1>
          <form onSubmit={signIn} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary" disabled={loading}>
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🛠️ Адмін-панель</h1>
        <div className="flex items-center space-x-4">
          <a 
            href="/"
            className="btn-secondary text-sm"
          >
            ← Повернутися до калькулятора
          </a>
          <span className="text-gray-600">Вітаємо, {user.email}</span>
          <button onClick={signOut} className="btn-secondary">
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
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Категорія</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">до 30 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">31-90 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">91-180 днів</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">181-365 днів</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">
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
        {activeTab !== 'logs' && (
          <div className="mt-6">
            <button onClick={saveData} className="btn-primary">
              Зберегти зміни
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
