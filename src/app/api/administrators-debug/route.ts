import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple Administrators API: Starting...')
    
    // Перевірка environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 Environment check:', { 
      urlConfigured: !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
      keyConfigured: !!supabaseKey && supabaseKey !== 'placeholder-key',
      url: supabaseUrl
    })
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      return NextResponse.json({ 
        error: 'Environment variables not configured',
        details: {
          url: supabaseUrl,
          keyPresent: !!supabaseKey
        }
      }, { status: 500 })
    }

    console.log('📊 Fetching administrators without auth check...')
    
    // ТИМЧАСОВО: Отримуємо адміністраторів БЕЗ перевірки аутентифікації
    const { data: administrators, error } = await supabase
      .from('administrators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ 
        error: 'Database query failed', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    console.log('✅ Successfully fetched administrators:', administrators?.length || 0)
    
    // Повертаємо дані з інформацією про cookies для діагностики
    const cookieHeader = request.headers.get('cookie')
    
    return NextResponse.json({ 
      administrators,
      debug: {
        count: administrators?.length || 0,
        cookiePresent: !!cookieHeader,
        cookieLength: cookieHeader?.length || 0,
        note: 'TEMPORARY: Auth check disabled for debugging'
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
