import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    
    console.log('🔍 Auth Debug - Raw cookie header:', cookieHeader)
    
    // Парсимо cookies
    const cookies: Record<string, string> = {}
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookies[name] = value
        }
      })
    }
    
    console.log('🍪 Parsed cookies:', cookies)
    
    // Тестуємо validation
    const sessionValidation = await validateAdminSession(cookieHeader)
    
    console.log('🔐 Session validation result:', sessionValidation)
    
    return NextResponse.json({
      cookieInfo: {
        present: !!cookieHeader,
        raw: cookieHeader,
        length: cookieHeader?.length || 0,
        parsed: cookies,
        adminSessionPresent: !!cookies.admin_session
      },
      validation: {
        isValid: sessionValidation.isValid,
        error: sessionValidation.error,
        admin: sessionValidation.admin ? {
          id: sessionValidation.admin.id,
          login: sessionValidation.admin.login,
          role: sessionValidation.admin.role
        } : null
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL
      }
    })

  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return NextResponse.json({
      error: 'Auth debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
