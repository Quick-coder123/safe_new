import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [hasTempPassword, setHasTempPassword] = useState<boolean>(false)

  useEffect(() => {
    checkUser()

    // Підписка на зміни статусу аутентифікації
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
          checkAdminRole(session.user.id)
        } else {
          setUser(null)
          setAdminRole(null)
          setHasTempPassword(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await checkAdminRole(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
      setAdminRole(null)
      setHasTempPassword(false)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminRole = async (userId: string) => {
    try {
      const { data: admin } = await supabase
        .from('administrators')
        .select('role, is_temp_password')
        .eq('user_id', userId)
        .single()
      
      setAdminRole(admin?.role || null)
      setHasTempPassword(admin?.is_temp_password || false)
    } catch (error) {
      console.error('Error checking admin role:', error)
      setAdminRole(null)
      setHasTempPassword(false)
    }
  }

  return {
    user,
    loading,
    adminRole,
    hasTempPassword,
    isAdmin: !!adminRole,
    isSuperAdmin: adminRole === 'super_admin'
  }
}
