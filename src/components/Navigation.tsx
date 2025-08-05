'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  onLoginClick?: () => void
}

export default function Navigation({ onLoginClick }: NavigationProps) {
  const { isAdmin, isSuperAdmin } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              🔐 Safe Rental Calculator
            </h1>
          </div>
          
          {/* Центральний індикатор статусу */}
          <div className="flex items-center">
            {isAdmin && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-lg shadow-lg text-sm font-medium animate-fadeIn">
                <span>✅</span>
                <span>{isSuperAdmin ? 'Супер-адміністратор' : 'Адміністратор'}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAdmin && pathname !== '/admin' && (
              <button 
                onClick={() => {
                  console.log('Navigation login button clicked')
                  onLoginClick?.()
                }}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                🔐 Вхід
              </button>
            )}
            {isAdmin && pathname !== '/admin' && (
              <a 
                href="/admin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ⚙️ Адмін-панель
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
