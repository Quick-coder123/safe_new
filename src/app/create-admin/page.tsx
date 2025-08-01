'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CreateAdminPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('Admin123!')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Створюємо користувача
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage('Помилка: ' + error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Додаємо в таблицю адміністраторів як супер-адміністратора
        const { error: insertError } = await supabase
          .from('administrators')
          .insert({
            user_id: data.user.id,
            email: email,
            role: 'super_admin'
          })

        if (insertError) {
          setMessage('Помилка додавання в таблицю адміністраторів: ' + insertError.message)
        } else {
          setMessage('Супер-адміністратор успішно створений! Email: ' + email)
        }
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
            <label className="form-label">Email адміністратора</label>
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
            <li>Введіть email та пароль для адміністратора</li>
            <li>Натисніть "Створити адміністратора"</li>
            <li>Перейдіть на <a href="/admin" className="text-blue-600 hover:underline">/admin</a></li>
            <li>Увійдіть з створеними даними</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
