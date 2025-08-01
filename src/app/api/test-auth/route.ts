import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Auth Test: Starting authentication test...')
    
    const cookieHeader = request.headers.get('cookie')
    console.log('🍪 Auth Test: Cookie header received:', cookieHeader ? 'YES' : 'NO')
    
    if (cookieHeader) {
      console.log('🍪 Auth Test: Cookie header length:', cookieHeader.length)
      console.log('🍪 Auth Test: Cookie header content:', cookieHeader.substring(0, 100) + '...')
      
      const cookies = cookieHeader.split('; ')
      console.log('🍪 Auth Test: Number of cookies:', cookies.length)
      console.log('🍪 Auth Test: Cookie names:', cookies.map(c => c.split('=')[0]))
    }

    const sessionValidation = await validateAdminSession(cookieHeader)
    
    return NextResponse.json({
      success: sessionValidation.isValid,
      error: sessionValidation.error,
      admin: sessionValidation.admin ? {
        login: sessionValidation.admin.login,
        role: sessionValidation.admin.role,
        id: sessionValidation.admin.id
      } : null,
      cookiePresent: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0
    })

  } catch (error) {
    console.error('🧪 Auth Test: Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
