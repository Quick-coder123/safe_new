'use client'

import { useEffect, useState } from 'react'
import CredentialsModal from '@/components/CredentialsModal'
import ResetPasswordModal from '@/components/ResetPasswordModal'
import type { useConfirmDialog } from '@/components/ConfirmDialog'
import type { useNotification } from '@/components/Notification'

export interface Administrator {
  id: number
  login: string
  role: 'admin' | 'super_admin'
  is_temp_password: boolean
  created_at: string
  created_by: string
}

interface AdministratorsTabProps {
  currentAdminId: number | undefined
  showConfirm: ReturnType<typeof useConfirmDialog>['showConfirm']
  showNotification: ReturnType<typeof useNotification>['showNotification']
}

/** Вкладка «Адміністратори»: список, створення, ролі, скидання паролів (лише супер-адмін). */
export default function AdministratorsTab({ currentAdminId, showConfirm, showNotification }: AdministratorsTabProps) {
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  const [newAdminLogin, setNewAdminLogin] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin')
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newCredentials, setNewCredentials] = useState({ login: '', password: '' })
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState({ login: '', password: '' })

  useEffect(() => {
    loadAdministrators()
  }, [])

  const loadAdministrators = async () => {
    try {
      const response = await fetch('/api/administrators')

      if (response.ok) {
        const { administrators } = await response.json()
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
      // Тимчасовий пароль генерується на сервері
      const response = await fetch('/api/administrators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: newAdminLogin.trim(),
          role: newAdminRole,
        }),
      })

      if (response.ok) {
        const { temporaryPassword } = await response.json()
        // Показуємо модальне вікно з credentials
        setNewCredentials({ login: newAdminLogin.trim(), password: temporaryPassword })
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
      const response = await fetch(`/api/administrators/${administratorId}`, {
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
      const response = await fetch(`/api/administrators/${administratorId}`, {
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
      const response = await fetch('/api/reset-password', {
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

  return (
    <>
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
                    {adminItem.id === currentAdminId && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Ви</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <select
                      className="form-select text-sm"
                      value={adminItem.role}
                      onChange={(e) => updateAdministratorRole(adminItem.id, e.target.value)}
                      disabled={adminItem.id === currentAdminId}
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
                      {adminItem.id !== currentAdminId && (
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
    </>
  )
}
