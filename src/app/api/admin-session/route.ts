import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ admin: null })
    }

    const adminData = JSON.parse(sessionCookie.value)
    
    return NextResponse.json({ admin: adminData })

  } catch (error) {
    console.error('Error getting admin session:', error)
    return NextResponse.json({ admin: null })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Вихід виконано' })
    
    // Видаляємо cookie сесії
    response.cookies.delete('admin_session')
    
    return response

  } catch (error) {
    console.error('Error during admin logout:', error)
    return NextResponse.json(
      { error: 'Помилка виходу' },
      { status: 500 }
    )
  }
}
