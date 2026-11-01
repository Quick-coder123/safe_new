'use client'

import { useState, useEffect } from 'react'
import Notification from '@/components/Notification'
import { 
  calculateRental,
  calculateDays,
  addTermDays,
  nextWorkingDay,
  MAX_TERM_DAYS,
  formatDateForInput, 
  formatDateForDisplay,
  parseDateFromInput,
  getDaysDeclension,
  type CalculationInput,
  type CalculationResult
} from '@/utils/calculator'
import { useAuth } from '@/contexts/AuthContext'
import { useConfig } from '@/hooks/useConfig'

export default function HomePage() {
  const { isAdmin } = useAuth()
  const { config, demo, loading: configLoading, error: configError, reload } = useConfig()
  
  const [formData, setFormData] = useState<CalculationInput>({
    category: 'I',
    contractType: 'new',
    coverageType: 'insurance',
    startDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())),
    endDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 31)),
    penalty: 0,
    trustDocuments: 0,
    packages: 0,
  })

  const [termDays, setTermDays] = useState<number>(31)

  const [result, setResult] = useState<CalculationResult | null>(null)
  // Реквізити беруться з налаштувань (редагуються в адмін-панелі)
  const paymentDetails = {
    recipient: config?.settings?.company_name || '',
    edrpou: config?.settings?.company_edrpou || '',
    iban: config?.settings?.company_iban || '',
    purpose: config?.settings?.payment_purpose || 'Оплата за оренду індивідуального сейфу',
  }
  const insurancePaymentUrl = config?.settings?.insurance_payment_url || ''
  const paymentDetailsComplete = !!(paymentDetails.recipient && paymentDetails.edrpou && paymentDetails.iban)

  // Стан для notification
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  // Функція для показу notification
  const showNotification = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    })
  }

  // Перерахунок при зміні даних
  useEffect(() => {
    if (!config) return // Чекаємо поки config завантажиться
    
    try {
      const calculationResult = calculateRental(formData, config)
      setResult(calculationResult)
    } catch (error) {
      console.error('Помилка розрахунку:', error)
      showNotification('Помилка', 'Помилка розрахунку. Перевірте введені дані.', 'error')
      setResult(null)
    }
  }, [formData, config])

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
      const endDate = addTermDays(date, termDays)
      setFormData(prev => ({
        ...prev,
        endDate: endDate
      }))
    }
    
    // Якщо змінюється кінцева дата, пересчитуємо термін
    if (field === 'endDate') {
      const calculatedDays = calculateDays(formData.startDate, date)
      if (calculatedDays > 0) {
        setTermDays(calculatedDays)
      }
    }
  }

  const handleTermDaysChange = (rawDays: number) => {
    const days = Math.min(Math.max(Math.floor(rawDays) || 1, 1), MAX_TERM_DAYS)
    setTermDays(days)
    // Автоматично розраховуємо кінцеву дату
    const endDate = addTermDays(formData.startDate, days)
    setFormData(prev => ({
      ...prev,
      endDate: endDate
    }))
  }

  // Переносимо дату закінчення на найближчий робочий день
  const moveEndDateToWorkingDay = () => {
    const endDate = nextWorkingDay(formData.endDate)
    setFormData(prev => ({ ...prev, endDate }))
    const days = calculateDays(formData.startDate, endDate)
    if (days > 0) setTermDays(days)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Готово!', 'Скопійовано до буферу обміну!', 'success')
    }).catch(() => {
      showNotification('Помилка', 'Не вдалося скопіювати до буферу обміну', 'error')
    })
  }

  // Показуємо індикатор завантаження поки конфігурація не завантажена
  if (configLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative mb-6">
            {/* Основний спінер */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            {/* Центральна іконка */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-blue-600 animate-pulse">
              🔐
            </div>
          </div>
          <p className="text-gray-700 font-medium mb-3">Завантаження конфігурації...</p>
          <div className="flex justify-center space-x-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce animation-delay-150"></div>
            <div className="h-2 w-2 bg-blue-300 rounded-full animate-bounce animation-delay-300"></div>
          </div>
        </div>
      </div>
    )
  }

  // Показуємо помилку якщо конфігурація не завантажилась
  if (configError || !config) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Не вдалося завантажити актуальні тарифи{configError ? `: ${configError}` : ''}</p>
          <button className="btn-primary" onClick={reload}>Спробувати ще раз</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
      {demo && (
        <div className="alert-warning">
          ⚠️ Демо-режим: Supabase не налаштовано, показано тарифи за замовчуванням із ТЗ.
        </div>
      )}
      {/* Заголовок з навігацією */}
      <div className="relative">        
        {/* Основний заголовок */}
        <div className="text-center transform transition-all duration-1000 animate-slideInDown">
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Форма вводу */}
        <div className="calculator-card transform transition-all duration-700 hover:scale-105 hover:shadow-xl animate-slideInLeft">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>Вхідні дані</h2>
          
          <div className="space-y-4">
            {/* Категорія сейфу */}
            <div className="form-group">
              <label className="form-label">Категорія сейфу</label>
              <select 
                className="form-select animate-slideInUp"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {config?.categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                )) || []}
              </select>
            </div>

            {/* Тип договору */}
            <div className="form-group">
              <label className="form-label">Тип договору</label>
              <select 
                className="form-select animate-slideInUp"
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
                className="form-select animate-slideInUp"
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
                  className="form-input form-input-animated"
                  value={formatDateForInput(formData.startDate)}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Термін оренди (днів)</label>
                <input 
                  type="number"
                  className="form-input form-input-animated"
                  min="1"
                  max="365"
                  value={termDays}
                  onChange={(e) => handleTermDaysChange(parseInt(e.target.value) || 1)}
                  placeholder="Введіть кількість днів"
                />
                
                {/* Швидкий вибір терміну */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[7, 14, 31, 60, 91, 181, 365].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleTermDaysChange(days)}
                      className={`quick-select-btn px-3 py-1 text-xs rounded border transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 ${
                        termDays === days 
                          ? 'active bg-blue-500 text-white border-blue-500 shadow-lg' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md'
                      }`}
                    >
                      {days === 7 ? '1 тиж' : 
                       days === 14 ? '2 тиж' :
                       days === 31 ? '1 міс' :
                       days === 60 ? '2 міс' :
                       days === 91 ? '3 міс' :
                       days === 181 ? '6 міс' :
                       days === 365 ? '1 рік' : `${days}д`}
                    </button>
                  ))}
                </div>
                
                <p className="text-sm mt-1" style={{color: '#6b7280'}}>
                  Кінцева дата: {formatDateForDisplay(formData.endDate)} 
                  {result && (
                    <span className="ml-2 font-medium" style={{color: '#2563eb'}}>
                      (фактично {result.days} {getDaysDeclension(result.days)})
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
                placeholder="0.00"
                value={formData.penalty || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                  handleInputChange('penalty', val)
                }}
              />
            </div>

            {/* Додаткові послуги */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Додаткові послуги
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-sm">
                    <svg className="w-4 h-4 mr-1 text-gray-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Кількість довіреностей
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    min="0"
                    step="1"
                    placeholder="Введіть кількість"
                    value={formData.trustDocuments === 0 ? '' : formData.trustDocuments}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      handleInputChange('trustDocuments', val)
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-sm">
                    <svg className="w-4 h-4 mr-1 text-gray-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Кількість пакетів
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    min="0"
                    step="1"
                    placeholder="Введіть кількість"
                    value={formData.packages === 0 ? '' : formData.packages}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      handleInputChange('packages', val)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Результати розрахунку */}
        <div className="calculator-card transform transition-all duration-700 hover:scale-105 hover:shadow-xl animate-slideInRight">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>Розрахунок вартості</h2>
          
          {result && (
            <div className="space-y-4">
              {/* Попередження про вихідний день */}
              {result.isWeekend && (
                <div className="alert-warning flex flex-wrap items-center justify-between gap-2">
                  <span>⚠️ Увага! Дата закінчення припадає на вихідний день!</span>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={moveEndDateToWorkingDay}
                  >
                    Перенести на {formatDateForDisplay(nextWorkingDay(formData.endDate))}
                  </button>
                </div>
              )}
              {result.days < 1 && (
                <div className="alert-warning">
                  ⚠️ Дата закінчення раніше за дату початку.
                </div>
              )}
              {result.exceedsMaxTerm && (
                <div className="alert-warning">
                  ⚠️ Термін {result.days} {getDaysDeclension(result.days)} перевищує максимальний ({MAX_TERM_DAYS} днів). Оформіть договір на коротший строк з подальшою пролонгацією.
                </div>
              )}
              {result.insuranceUnavailable && !result.exceedsMaxTerm && result.days > 0 && (
                <div className="alert-warning">
                  ⚠️ Для терміну {result.days} {getDaysDeclension(result.days)} немає тарифу страхування ключа. Перевірте таблицю страхування в адмін-панелі.
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
                  <span className="font-medium" style={{color: '#1f2937'}}>{result.days} {getDaysDeclension(result.days)}</span>
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
                  <div className="flex justify-between items-center">
                    <span className="flex items-center" style={{color: '#1f2937'}}>
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Довіреності ({formData.trustDocuments} шт):
                    </span>
                    <span className="font-medium" style={{color: '#1f2937'}}>{result.trustDocumentsCost.toFixed(2)} грн</span>
                  </div>
                )}
                {result.packagesCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center" style={{color: '#1f2937'}}>
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Пакети ({formData.packages} шт):
                    </span>
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
                  className="btn-primary text-sm w-full btn-animated"
                  onClick={() => copyToClipboard(`
Розрахунок вартості оренди сейфу:

Категорія: ${config?.categories?.find(cat => cat.id === formData.category)?.name || formData.category}
Тип договору: ${formData.contractType === 'new' ? 'Новий' : 'Пролонгація'}
Тип покриття: ${formData.coverageType === 'insurance' ? 'Страхування ключа' : 'Грошове забезпечення'}

Дата початку: ${formData.startDate.toLocaleDateString('uk-UA')}
Дата закінчення: ${formData.endDate.toLocaleDateString('uk-UA')}
Термін оренди: ${result.days} ${getDaysDeclension(result.days)}
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
          <div className="calculator-card transform transition-all duration-700 hover:scale-105 hover:shadow-xl animate-slideInUp">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>⚙️ Налаштування реквізитів</h2>
          
          <div className="space-y-4">
            {!paymentDetailsComplete && (
              <div className="alert-warning">
                Реквізити не заповнені. Вкажіть отримувача, ЄДРПОУ та IBAN в{' '}
                <a href="/admin" className="underline">адмін-панелі → Налаштування</a>.
              </div>
            )}
            <p className="text-sm" style={{color: '#6b7280'}}>
              Реквізити редагуються в <a href="/admin" className="underline">адмін-панелі</a>.
            </p>

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
            {result && paymentDetailsComplete && (
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
                    className="btn-primary text-sm w-full btn-animated"
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
        <h2 className="text-xl font-semibold mb-4" style={{color: '#1f2937'}}>📊 Тарифи</h2>
        
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
                  {config?.categories?.map(category => (
                    <tr key={category.id} className={formData.category === category.id ? 'highlight' : ''}>
                      <td style={{color: '#1f2937', fontWeight: '600'}}>{category.name}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.up_to_30.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_31_to_90.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_91_to_180.toFixed(2)}</td>
                      <td style={{color: '#1f2937', textAlign: 'center'}}>{category.rates.from_181_to_365.toFixed(2)}</td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>

          {/* Страхування ключа */}
          <div>
            <h3 className="font-semibold mb-3" style={{color: '#1f2937'}}>Страхування ключа (грн, без ПДВ)</h3>
            <div className="space-y-2">
              {config?.insuranceRates?.map((rate, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span style={{color: '#1f2937'}}>
                    {rate.min_days}-{rate.max_days} днів
                  </span>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {rate.price.toFixed(2)} грн
                  </span>
                </div>
              )) || []}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-3" style={{color: '#1f2937'}}>Додаткові послуги</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span style={{color: '#1f2937'}}>Довіреність</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {Number(config.settings.trust_document_price || 0).toFixed(2)} грн
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span style={{color: '#1f2937'}}>Пакет</span>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {Number(config.settings.package_price || 0).toFixed(2)} грн
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div>
                    <span style={{color: '#1f2937'}}>Грошове забезпечення</span>
                    <div className="text-xs text-gray-600">Для нових договорів (альтернатива страхуванню)</div>
                  </div>
                  <span className="font-medium" style={{color: '#1f2937'}}>
                    {Number(config.settings.guarantee_amount || 0).toFixed(2)} грн
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Notification */}
    <Notification
      isOpen={notification.isOpen}
      title={notification.title}
      message={notification.message}
      type={notification.type}
      onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  )
}
