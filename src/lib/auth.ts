import { supabase } from '@/lib/supabase'

// Функція для перевірки admin сесії
export async function validateAdminSession(cookieHeader: string | null): Promise<{ isValid: boolean; admin?: any; error?: string }> {
  try {
    console.log('🔍 Auth: Starting session validation...')
    
    if (!cookieHeader) {
      console.log('❌ Auth: No cookie header')
      return { isValid: false, error: 'No cookie header' }
    }

    console.log('🍪 Auth: Cookie header present, length:', cookieHeader.length)

    // Знаходимо admin_session cookie
    const cookies = cookieHeader.split('; ')
    const sessionCookie = cookies.find(cookie => cookie.startsWith('admin_session='))
    
    if (!sessionCookie) {
      console.log('❌ Auth: No admin session cookie found')
      console.log('🍪 Auth: Available cookies:', cookies.map(c => c.split('=')[0]))
      return { isValid: false, error: 'No admin session cookie' }
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue || sessionValue === '') {
      console.log('❌ Auth: Empty session value')
      return { isValid: false, error: 'Empty session value' }
    }

    console.log('🔑 Auth: Session value found, length:', sessionValue.length)

    // Декодуємо sessionValue (це login адміністратора)
    let adminLogin: string
    try {
      adminLogin = decodeURIComponent(sessionValue)
      console.log('👤 Auth: Decoded admin login:', adminLogin)
    } catch (error) {
      console.log('❌ Auth: Failed to decode session value:', error)
      return { isValid: false, error: 'Invalid session format' }
    }

    // Перевіряємо environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.error('❌ Auth: Environment variables not configured:', { supabaseUrl, keyPresent: !!supabaseKey })
      return { isValid: false, error: 'Database configuration error' }
    }

    console.log('🗄️ Auth: Checking admin in database...')

    // Перевіряємо адміністратора в базі даних
    const { data: admin, error } = await supabase
      .from('administrators')
      .select('*')
      .eq('login', adminLogin)
      .single()

    if (error) {
      console.error('❌ Auth: Database query error:', error)
      return { isValid: false, error: `Database error: ${error.message}` }
    }

    if (!admin) {
      console.log('❌ Auth: Admin not found for login:', adminLogin)
      return { isValid: false, error: 'Admin not found' }
    }

    console.log('✅ Auth: Session validation successful for admin:', admin.login, 'role:', admin.role)
    return { isValid: true, admin }

  } catch (error) {
    console.error('❌ Auth: Session validation exception:', error)
    return { isValid: false, error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}
