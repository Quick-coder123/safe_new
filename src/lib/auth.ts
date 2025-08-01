import { supabase } from '@/lib/supabase'

// Функція для перевірки admin сесії
export async function validateAdminSession(cookieHeader: string | null): Promise<{ isValid: boolean; admin?: any; error?: string }> {
  try {
    if (!cookieHeader) {
      return { isValid: false, error: 'No cookie header' }
    }

    // Знаходимо admin_session cookie
    const cookies = cookieHeader.split('; ')
    const sessionCookie = cookies.find(cookie => cookie.startsWith('admin_session='))
    
    if (!sessionCookie) {
      return { isValid: false, error: 'No admin session cookie' }
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue || sessionValue === '') {
      return { isValid: false, error: 'Empty session value' }
    }

    // Декодуємо sessionValue (це login адміністратора)
    let adminLogin: string
    try {
      adminLogin = decodeURIComponent(sessionValue)
    } catch {
      return { isValid: false, error: 'Invalid session format' }
    }

    // Перевіряємо адміністратора в базі даних
    const { data: admin, error } = await supabase
      .from('administrators')
      .select('*')
      .eq('login', adminLogin)
      .single()

    if (error || !admin) {
      return { isValid: false, error: 'Admin not found' }
    }

    return { isValid: true, admin }

  } catch (error) {
    console.error('Session validation error:', error)
    return { isValid: false, error: 'Validation failed' }
  }
}
