
'use client'
import Link from 'next/link'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  onLoginClick?: () => void
}

export default function Navigation({ onLoginClick }: NavigationProps) {
  const { isAdmin, isSuperAdmin, admin, logout } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-semibold text-gray-900"
              style={{ textDecoration: 'none' }}
            >
              🔐 Safe Rental Calculator
            </Link>
          </div>
          {/* Центральний індикатор статусу */}
          <div className="flex items-center">
            {isAdmin && (
              <div className="flex items-center space-x-2 px-4 py-1 bg-white/80 border border-gray-200 rounded-lg shadow-sm text-gray-700 text-sm font-medium animate-fadeIn transition-all duration-500">
                <span className="text-lg" style={{ opacity: 0.7 }}>{isSuperAdmin ? '👑' : '🛡️'}</span>
                <span className="font-semibold tracking-wide" style={{ opacity: 0.85 }}>
                  {isSuperAdmin ? 'Супер-адміністратор' : 'Адміністратор'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!isAdmin && pathname !== '/admin' && (
              <button 
                onClick={() => {
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
            {/* Вітання та кнопка Вийти */}
            {isAdmin && (
              <>
                <span className="text-gray-600">Вітаємо, {admin?.login}</span>
                <button
                  onClick={logout}
                  className="btn-secondary transition-all duration-300 hover:scale-105 hover:bg-red-500 hover:text-white"
                >
                  Вийти
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
