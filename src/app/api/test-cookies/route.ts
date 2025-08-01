import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    const userAgent = request.headers.get('user-agent')
    const host = request.headers.get('host')
    const referer = request.headers.get('referer')
    
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

    return NextResponse.json({
      cookieInfo: {
        present: !!cookieHeader,
        raw: cookieHeader,
        length: cookieHeader?.length || 0,
        parsed: cookies,
        adminSession: cookies.admin_session ? 'Present' : 'Missing'
      },
      requestInfo: {
        userAgent,
        host,
        referer,
        url: request.url,
        method: request.method
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to analyze cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
