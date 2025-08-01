'use client'

import { useState, useEffect } from 'react'
import { 
  calculateRental, 
  formatDateForInput, 
  parseDateFromInput,
  SAFE_CATEGORIES,
  type CalculationInput,
  type CalculationResult
} from '@/utils/calculator'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { isAdmin } = useAuth()
  
  const [formData, setFormData] = useState<CalculationInput>({
    category: 'I',
    contractType: 'new',
    coverageType: 'insurance',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 днів
    penalty: 0,
    trustDocuments: 0,
    packages: 0,
  })

  const [termDays, setTermDays] = useState<number>(30)

  const [result, setResult] = useState<CalculationResult | null>(null)
  const [paymentDetails, setPaymentDetails] = useState({
    recipient: '',
    edrpou: '',
    iban: '',
    purpose: 'Оплата за оренду індивідуального сейфу',
  })
  const [insurancePaymentUrl, setInsurancePaymentUrl] = useState('')

  // Перерахунок при зміні даних
  useEffect(() => {
    try {
      const calculationResult = calculateRental(formData)
      setResult(calculationResult)
    } catch (error) {
      console.error('Помилка розрахунку:', error)
      setResult(null)
    }
  }, [formData])

  const handleInputChange = (field: keyof CalculationInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = parseDateFromInput(value)
    setFormData(prev => ({
      ...prev,
      [field]: date
    }))
    
    // Якщо змінюється початкова дата, пересчитуємо кінцеву на основі терміну
    if (field === 'startDate') {
      const endDate = new Date(date.getTime() + (termDays - 1) * 24 * 60 * 60 * 1000)
      setFormData(prev => ({
        ...prev,
        endDate: endDate
      }))
    }
    
    // Якщо змінюється кінцева дата, пересчитуємо термін
    if (field === 'endDate') {
      const diffTime = date.getTime() - formData.startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      if (diffDays > 0) {
        setTermDays(diffDays)
      }
    }
  }

  const handleTermDaysChange = (days: number) => {
    setTermDays(days)
    // Автоматично розраховуємо кінцеву дату
    const endDate = new Date(formData.startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000)
    setFormData(prev => ({
      ...prev,
      endDate: endDate
    }))
  }

  const generatePaymentDetails = () => {
    if (!result) return

    const paymentAmount = result.totalCost - result.insurance
    const updatedPurpose = `${paymentDetails.purpose}. Сума: ${paymentAmount.toFixed(2)} грн`
    
    alert(`Реквізити для оплати:
Отримувач: ${paymentDetails.recipient}
Код ЄДРПОУ: ${paymentDetails.edrpou}
IBAN: ${paymentDetails.iban}
Призначення платежу: ${updatedPurpose}
Сума: ${paymentAmount.toFixed(2)} грн`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Скопійовано до буферу обміну!')
    })
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{color: '#1f2937'}}>
          🧮 Калькулятор оренди сейфу
        </h1>
        <p style={{color: '#6b7280'}}>
          Розрахунок вартості оренди індивідуального сейфу з динамічними тарифами
        </p>
        {!isAdmin && (
          <div className="mt-3">
            <a 
              href="/admin" 
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              🔐 Вхід для адміністратора
            </a>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Форма вводу */}
        <div className="calculator-card">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>Вхідні дані</h2>
          
          <div className="space-y-4">
            {/* Категорія сейфу */}
            <div className="form-group">
              <label className="form-label">Категорія сейфу</label>
              <select 
                className="form-select"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {SAFE_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип договору */}
            <div className="form-group">
              <label className="form-label">Тип договору</label>
              <select 
                className="form-select"
                value={formData.contractType}
                onChange={(e) => handleInputChange('contractType', e.target.value as 'new' | 'extension')}
              >
                <option value="new">Новий</option>
                <option value="extension">Пролонгація</option>
              </select>
            </div>

            {/* Тип покриття */}
            <div className="form-group">
              <label className="form-label">Тип покриття</label>
              <select 
                className="form-select"
                value={formData.coverageType}
                onChange={(e) => handleInputChange('coverageType', e.target.value as 'insurance' | 'guarantee')}
              >
                <option value="insurance">Страхування ключа</option>
                <option value="guarantee">Грошове забезпечення</option>
              </select>
            </div>

            {/* Дати та термін */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group">
                <label className="form-label">Дата початку</label>
                <input 
                  type="date"
                  className="form-input"
                  value={formatDateForInput(formData.startDate)}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Термін оренди (днів)</label>
                <input 
                  type="number"
                  className="form-input"
                  min="1"
                  max="365"
                  value={termDays}
                  onChange={(e) => handleTermDaysChange(parseInt(e.target.value) || 1)}
                  placeholder="Введіть кількість днів"
                />
                
                {/* Швидкий вибір терміну */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[7, 14, 30, 60, 91, 181, 365].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleTermDaysChange(days)}
                      className={`px-3 py-1 text-xs rounded border ${
                        termDays === days 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {days === 7 ? '1 тиж' : 
                       days === 14 ? '2 тиж' :
                       days === 30 ? '1 міс' :
                       days === 60 ? '2 міс' :
                       days === 91 ? '3 міс' :
                       days === 181 ? '6 міс' :
                       days === 365 ? '1 рік' : `${days}д`}
                    </button>
                  ))}
                </div>
                
                <p className="text-sm mt-1" style={{color: '#6b7280'}}>
                  Кінцева дата: {formatDateForInput(formData.endDate)} 
                  {result && (
                    <span className="ml-2 font-medium" style={{color: '#2563eb'}}>
                      (фактично {result.days} днів)
                    </span>
                  )}
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Дата закінчення (автоматично)</label>
                <input 
                  type="date"
                  className="form-input bg-gray-100"
                  value={formatDateForInput(formData.endDate)}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  title="Автоматично розраховується на основі терміну. Можна змінити вручну."
                />
              </div>
            </div>

            {/* Пеня */}
            <div className="form-group">
              <label className="form-label">Пеня (грн, опціонально)</label>
              <input 
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                value={formData.penalty}
                onChange={(e) => handleInputChange('penalty', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Додаткові послуги */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Кількість довіреностей</label>
                <input 
                  type="number"
                  className="form-input"
                  min="0"
                  value={formData.trustDocuments}
                  onChange={(e) => handleInputChange('trustDocuments', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Кількість пакетів</label>
                <input 
                  type="number"
                  className="form-input"
                  min="0"
                  value={formData.packages}
                  onChange={(e) => handleInputChange('packages', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Результати розрахунку */}
        <div className="calculator-card">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>Розрахунок вартості</h2>
          
          {result && (
            <div className="space-y-4">
              {/* Попередження про вихідний день */}
              {result.isWeekend && (
                <div className="alert-warning">
                  ⚠️ Увага! Дата закінчення припадає на вихідний день!
                </div>
              )}

              {/* Деталі розрахунку */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span style={{color: '#1f2937'}}>Дата початку:</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {formData.startDate.toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{color: '#1f2937'}}>Дата закінчення:</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {formData.endDate.toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{color: '#1f2937'}}>Термін оренди:</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>{result.days} днів</span>
                </div>
                <div className="flex justify-between">
                  <span style={{color: '#1f2937'}}>Тариф за день:</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>{result.safeRate.toFixed(2)} грн</span>
                </div>
                <div className="flex justify-between">
                  <span style={{color: '#1f2937'}}>Вартість сейфу:</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>{result.safeCost.toFixed(2)} грн</span>
                </div>
                {result.insurance > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#1f2937'}}>Страхування ключа:</span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.insurance.toFixed(2)} грн</span>
                  </div>
                )}
                {result.guarantee > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#1f2937'}}>Грошове забезпечення:</span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.guarantee.toFixed(2)} грн</span>
                  </div>
                )}
                {result.trustDocumentsCost > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#1f2937'}}>Довіреності:</span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.trustDocumentsCost.toFixed(2)} грн</span>
                  </div>
                )}
                {result.packagesCost > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#1f2937'}}>Пакети:</span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.packagesCost.toFixed(2)} грн</span>
                  </div>
                )}
                {result.penalty > 0 && (
                  <div className="flex justify-between">
                    <span style={{color: '#1f2937'}}>Пеня:</span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.penalty.toFixed(2)} грн</span>
                  </div>
                )}
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-bold">
                  <span style={{color: '#1f2937'}}>Підсумкова сума:</span>
                  <span style={{color: '#2563eb'}}>{result.totalCost.toFixed(2)} грн</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  className="btn-primary text-sm w-full"
                  onClick={() => copyToClipboard(`
Розрахунок вартості оренди сейфу:

Категорія: ${SAFE_CATEGORIES.find(cat => cat.id === formData.category)?.name || formData.category}
Тип договору: ${formData.contractType === 'new' ? 'Новий' : 'Пролонгація'}
Тип покриття: ${formData.coverageType === 'insurance' ? 'Страхування ключа' : 'Грошове забезпечення'}

Дата початку: ${formData.startDate.toLocaleDateString('uk-UA')}
Дата закінчення: ${formData.endDate.toLocaleDateString('uk-UA')}
Термін оренди: ${result.days} днів
Тариф за день: ${result.safeRate.toFixed(2)} грн

Деталі розрахунку:
- Вартість сейфу: ${result.safeCost.toFixed(2)} грн${result.insurance > 0 ? `
- Страхування ключа: ${result.insurance.toFixed(2)} грн` : ''}${result.guarantee > 0 ? `
- Грошове забезпечення: ${result.guarantee.toFixed(2)} грн` : ''}${result.trustDocumentsCost > 0 ? `
- Довіреності: ${result.trustDocumentsCost.toFixed(2)} грн` : ''}${result.packagesCost > 0 ? `
- Пакети: ${result.packagesCost.toFixed(2)} грн` : ''}${result.penalty > 0 ? `
- Пеня: ${result.penalty.toFixed(2)} грн` : ''}

ПІДСУМКОВА СУМА: ${result.totalCost.toFixed(2)} грн
                  `.trim())}
                >
                  📋 Скопіювати розрахунок
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Налаштування реквізитів - тільки для адміністраторів */}
        {isAdmin && (
          <div className="calculator-card">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>⚙️ Налаштування реквізитів</h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Назва отримувача</label>
              <input 
                type="text"
                className="form-input"
                value={paymentDetails.recipient}
                onChange={(e) => setPaymentDetails(prev => ({...prev, recipient: e.target.value}))}
                placeholder="Назва отримувача"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Код ЄДРПОУ</label>
              <input 
                type="text"
                className="form-input"
                value={paymentDetails.edrpou}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setPaymentDetails(prev => ({...prev, edrpou: value}))
                }}
                placeholder="1234567890"
                maxLength={10}
                pattern="[0-9]{10}"
                title="ЄДРПОУ повинен містити рівно 10 цифр"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input 
                type="text"
                className="form-input"
                value={paymentDetails.iban}
                onChange={(e) => setPaymentDetails(prev => ({...prev, iban: e.target.value}))}
                placeholder="UA123456789012345678901234567"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Призначення платежу</label>
              <textarea 
                className="form-input"
                rows={2}
                value={paymentDetails.purpose}
                onChange={(e) => setPaymentDetails(prev => ({...prev, purpose: e.target.value}))}
                placeholder="Опис призначення платежу"
              />
            </div>
            
            {formData.coverageType === 'insurance' && (
              <div className="form-group">
                <label className="form-label">Посилання для оплати страхування ключа</label>
                <input 
                  type="url"
                  className="form-input"
                  value={insurancePaymentUrl}
                  onChange={(e) => setInsurancePaymentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Кнопка оформлення страхування */}
            {formData.coverageType === 'insurance' && (
              <div className="mt-4">
                <a 
                  href="https://ars.aiwa.in.ua/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary inline-flex items-center justify-center"
                >
                  🛡️ Оформити страхування ключа
                </a>
              </div>
            )}

            {/* Реквізити для оплати */}
            {result && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3 mt-6">
                <h3 className="font-semibold" style={{color: '#1e40af'}}>📋 Реквізити для оплати</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span style={{color: '#1d4ed8'}}>Отримувач:</span>
                    <span className="ml-2" style={{color: '#1f2937'}}>{paymentDetails.recipient}</span>
                  </div>
                  <div>
                    <span style={{color: '#1d4ed8'}}>Код ЄДРПОУ:</span>
                    <span className="ml-2" style={{color: '#1f2937'}}>{paymentDetails.edrpou}</span>
                  </div>
                  <div>
                    <span style={{color: '#1d4ed8'}}>IBAN:</span>
                    <span className="ml-2 font-mono" style={{color: '#1f2937'}}>{paymentDetails.iban}</span>
                  </div>
                  <div>
                    <span style={{color: '#1d4ed8'}}>Призначення:</span>
                    <span className="ml-2" style={{color: '#1f2937'}}>{paymentDetails.purpose}</span>
                  </div>
                  <div>
                    <span style={{color: '#1d4ed8'}}>Сума:</span>
                    <span className="ml-2 font-bold" style={{color: '#1f2937'}}>
                      {(result.totalCost - result.insurance).toFixed(2)} грн
                    </span>
                    {result.insurance > 0 && (
                      <div className="text-xs mt-1" style={{color: '#6b7280'}}>
                        * Страхування ключа ({result.insurance.toFixed(2)} грн) оплачується окремо
                      </div>
                    )}
                  </div>
                  
                  {formData.coverageType === 'insurance' && insurancePaymentUrl && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div>
                        <span style={{color: '#1d4ed8'}}>Оплата страхування ключа:</span>
                        <div className="mt-1">
                          <a 
                            href={insurancePaymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            🔗 Перейти до оплати
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button 
                    className="btn-primary text-sm w-full"
                    onClick={() => copyToClipboard(`
Реквізити для оплати:

Отримувач: ${paymentDetails.recipient}
Код ЄДРПОУ: ${paymentDetails.edrpou}
IBAN: ${paymentDetails.iban}
Призначення: ${paymentDetails.purpose}
Сума: ${(result.totalCost - result.insurance).toFixed(2)} грн${result.insurance > 0 ? `
* Страхування ключа (${result.insurance.toFixed(2)} грн) оплачується окремо` : ''}${formData.coverageType === 'insurance' && insurancePaymentUrl ? `

Посилання для оплати страхування: ${insurancePaymentUrl}` : ''}
                    `.trim())}
                  >
                    📋 Скопіювати реквізити
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Інформація про тарифи */}
      <div className="calculator-card">
        <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>📊 Тарифні таблиці</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Тарифи на сейфи */}
          <div>
            <h3 className="font-semibold mb-3" style={{color: '#1f2937'}}>Тарифи на сейфи (грн/день, з ПДВ)</h3>
            <div className="overflow-x-auto">
              <table className="rates-table">
                <thead>
                  <tr>
                    <th style={{color: '#1f2937', fontWeight: 'bold'}}>Категорія</th>
                    <th style={{color: '#1f2937', fontWeight: 'bold'}}>до 30 днів</th>
                    <th style={{color: '#1f2937', fontWeight: 'bold'}}>31-90 днів</th>
                    <th style={{color: '#1f2937', fontWeight: 'bold'}}>91-180 днів</th>
                    <th style={{color: '#1f2937', fontWeight: 'bold'}}>181-365 днів</th>
                  </tr>
                </thead>
                <tbody>
                  {SAFE_CATEGORIES.map(category => (
                    <tr key={category.id} className={formData.category === category.id ? 'highlight' : ''}>
                      <td style={{color: '#1f2937', fontWeight: '600'}}>{category.name}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.up_to_30.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_31_to_90.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_91_to_180.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_181_to_365.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Страхування ключа */}
          <div>
            <h3 className="font-semibold mb-3" style={{color: '#1f2937'}}>Страхування ключа (грн, без ПДВ)</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span style={{color: '#1f2937'}}>до 90 днів</span>
                <span className="font-medium" style={{color: '#1f2937'}}>285.00 грн</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span style={{color: '#1f2937'}}>91-180 днів</span>
                <span className="font-medium" style={{color: '#1f2937'}}>370.00 грн</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span style={{color: '#1f2937'}}>181-270 днів</span>
                <span className="font-medium" style={{color: '#1f2937'}}>430.00 грн</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span style={{color: '#1f2937'}}>271-365 днів</span>
                <span className="font-medium" style={{color: '#1f2937'}}>500.00 грн</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-3" style={{color: '#1f2937'}}>Додаткові послуги</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span style={{color: '#1f2937'}}>Довіреність</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>300.00 грн</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span style={{color: '#1f2937'}}>Пакет</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>50.00 грн</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <span style={{color: '#1f2937'}}>Грошове забезпечення</span>
                    <div className="text-xs text-gray-600">Для нових договорів (альтернатива страхуванню)</div>
                  </div>
                  <span className="font-medium" style={{color: '#1f2937'}}>5000.00 грн</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
