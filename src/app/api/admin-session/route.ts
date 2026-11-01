import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from '@/lib/session'

// GET — повертає актуальні дані поточного адміністратора (або null)
export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return NextResponse.json({ admin: null })

  try {
    const { data: admin } = await getSupabase()
      .from('administrators')
      .select('id, login, role, is_temp_password')
      .eq('id', session.adminId)
      .maybeSingle()

    if (!admin) {
      const response = NextResponse.json({ admin: null })
      response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
      return response
    }

    return NextResponse.json({
      admin: {
        adminId: admin.id,
        login: admin.login,
        role: admin.role,
        isTempPassword: !!admin.is_temp_password,
      },
    })
  } catch (error) {
    console.error('Admin session error:', error)
    return NextResponse.json({ admin: null })
  }
}

// DELETE — вихід
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Вихід виконано' })
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
  return response
}
