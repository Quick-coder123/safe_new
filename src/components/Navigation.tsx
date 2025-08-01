'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { isAdmin } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              🔐 Safe Rental Calculator
            </h1>
          </div>
          <div className="flex items-center space-x-4">
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
