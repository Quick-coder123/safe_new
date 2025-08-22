'use client'

import { useState } from 'react'
import { calculateDays } from '@/utils/calculator'

export default function DateTestPage() {
  const [startDate, setStartDate] = useState(new Date('2025-08-27'))
  const [termDays, setTermDays] = useState(182)
  const [endDate, setEndDate] = useState(new Date())

  const handleTermDaysChange = (days: number) => {
    setTermDays(days)
    const newEndDate = new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000)
    setEndDate(newEndDate)
    console.log('Test component - Term days changed to:', days)
    console.log('Start date:', startDate.toLocaleDateString('uk-UA'))
    console.log('Calculated end date:', newEndDate.toLocaleDateString('uk-UA'))
  }

  const verificationDays = calculateDays(startDate, endDate)

  return (
    <div style={{ padding: '20px' }}>
      <h1>Тест розрахунку дат</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Початкова дата: </label>
        <span>{startDate.toLocaleDateString('uk-UA')}</span>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Термін (днів): </label>
        <input 
          type="number" 
          value={termDays} 
          onChange={(e) => handleTermDaysChange(Number(e.target.value))}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Кінцева дата: </label>
        <span style={{ fontWeight: 'bold', color: endDate.toLocaleDateString('uk-UA') === '24.02.2026' ? 'green' : 'red' }}>
          {endDate.toLocaleDateString('uk-UA')}
        </span>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Перевірка (calculateDays): </label>
        <span>{verificationDays} днів</span>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Результат: </label>
        <span style={{ fontWeight: 'bold', color: termDays === verificationDays ? 'green' : 'red' }}>
          {termDays === verificationDays ? '✅ Правильно' : '❌ Помилка'}
        </span>
      </div>
    </div>
  )
}
