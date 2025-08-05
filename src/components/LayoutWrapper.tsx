'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import LoginModal from '@/components/LoginModal'
import { AuthProvider } from '@/contexts/AuthContext'

interface LayoutWrapperProps {
  children: React.ReactNode
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleLoginClick = () => {
    console.log('Login button clicked')
    setShowLoginModal(true)
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    // Контекст автоматично оновиться після успішного входу
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
