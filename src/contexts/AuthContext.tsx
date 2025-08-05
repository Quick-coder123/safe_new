'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminData {
  adminId: number
  login: string
  role: string
  isTempPassword: boolean
}

interface AuthContextType {
  admin: AdminData | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  adminRole: string | null
  hasTempPassword: boolean
  login: (login: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAdminSession = async () => {
    try {
      const response = await fetch('/api/admin-session')
      const data = await response.json()
      
      setAdmin(data.admin)
    } catch (error) {
      console.error('Error checking admin session:', error)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAdminSession()
  }, [])

  const login = async (login: string, password: string) => {
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setAdmin(data.admin)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error during login:', error)
      return { success: false, error: 'Помилка з\'єднання' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin-session', { method: 'DELETE' })
      setAdmin(null)
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const refreshSession = async () => {
    await checkAdminSession()
  }

  const value: AuthContextType = {
    admin,
    loading,
    isAdmin: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
    adminRole: admin?.role || null,
    hasTempPassword: admin?.isTempPassword || false,
    login,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
