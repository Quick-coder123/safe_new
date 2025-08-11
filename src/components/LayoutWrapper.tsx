'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import LoginModal from '@/components/LoginModal'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

interface LayoutWrapperProps {
  children: React.ReactNode
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordModalShown, setPasswordModalShown] = useState(false)
  const { hasTempPassword, isAdmin, refreshSession } = useAuth()

  // Перевіряємо чи потрібно показати модальне вікно зміни пароля
  useEffect(() => {
    if (isAdmin && hasTempPassword && !passwordModalShown) {
      setShowPasswordModal(true)
      setPasswordModalShown(true)
    } else if (isAdmin && !hasTempPassword) {
      setShowPasswordModal(false)
    }
  }, [isAdmin, hasTempPassword, passwordModalShown])

  const handleLoginClick = () => {
    console.log('Login button clicked')
    setShowLoginModal(true)
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    // Контекст автоматично оновиться після успішного входу
  }

  const handlePasswordChangeSuccess = async (message: string) => {
    // Оновлюємо сесію для отримання актуального статусу пароля
    await refreshSession()
    setShowPasswordModal(false)
    // Показуємо сповіщення про успішну зміну пароля
    console.log('Password changed successfully:', message)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onLoginClick={handleLoginClick} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      {/* Глобальне модальне вікно для примусової зміни тимчасового пароля */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {}} // Не дозволяємо закрити модальне вікно без зміни пароля
        isRequired={true}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  )
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
}
