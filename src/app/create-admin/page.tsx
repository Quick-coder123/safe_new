'use client'

import { useState } from 'react'
import bcrypt from 'bcryptjs'

export default function CreateAdminPage() {
  const [login, setLogin] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Хешуємо пароль
      const passwordHash = await bcrypt.hash(password, 10)
      
      // Створюємо адміністратора через наш API
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: login,
          password_hash: passwordHash,
          role: 'super_admin',
          is_temp_password: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Супер-адміністратор успішно створений! Логін: ' + login)
        setLogin('')
        setPassword('')
      } else {
        setMessage('Помилка: ' + data.error)
      }
    } catch (error) {
      setMessage('Неочікувана помилка: ' + String(error))
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="calculator-card">
        <h1 className="text-2xl font-bold mb-6 text-center">
          👤 Створення першого супер-адміністратора
        </h1>
        
        <form onSubmit={createAdmin} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Логін адміністратора</label>
            <input
              type="text"
              className="form-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_-]+"
              title="Логін може містити тільки букви, цифри, підкреслення та дефіси"
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
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full btn-primary" 
            disabled={loading}
          >
            {loading ? 'Створення...' : 'Створити адміністратора'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.includes('помилка') || message.includes('Помилка') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold">Інструкції:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Введіть логін та пароль для адміністратора</li>
            <li>Натисніть &quot;Створити адміністратора&quot;</li>
            <li>Перейдіть на <a href="/admin" className="text-blue-600 hover:underline">/admin</a></li>
            <li>Увійдіть з створеними даними</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
