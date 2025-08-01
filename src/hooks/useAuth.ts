import { useState, useEffect } from 'react'

interface AdminData {
  adminId: number
  login: string
  role: string
  isTempPassword: boolean
}

export function useAuth() {
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminSession()
  }, [])

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

  return {
    admin,
    loading,
    login,
    logout,
    isAdmin: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
    adminRole: admin?.role || null,
    hasTempPassword: admin?.isTempPassword || false
  }
}
