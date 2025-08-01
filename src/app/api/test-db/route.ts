import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Перевіряємо environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured',
        details: {
          url_configured: !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
          key_configured: !!supabaseKey && supabaseKey !== 'placeholder-key',
          url_value: supabaseUrl,
          key_prefix: supabaseKey?.substring(0, 10) + '...'
        }
      }, { status: 500 })
    }

    // Перевіряємо з'єднання з базою даних
    const { data: administrators, error } = await supabase
      .from('administrators')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      administrators: administrators || [],
      count: administrators?.length || 0,
      environment: {
        url_configured: true,
        key_configured: true
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: String(error)
    }, { status: 500 })
  }
}
