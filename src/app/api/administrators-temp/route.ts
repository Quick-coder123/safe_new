import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createSupabaseClient()
    console.log('🔍 Administrators TEMP API: Starting without auth...')
    
    // Перевірка environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.error('❌ Environment variables not configured:', { supabaseUrl, keyPresent: !!supabaseKey })
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: 'Environment variables not properly configured'
      }, { status: 500 })
    }

    console.log('📊 Fetching administrators from database...')
    
    // Отримуємо список адміністраторів
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
    
    return NextResponse.json({ 
      administrators: administrators || [],
      debug: {
        count: administrators?.length || 0,
        note: 'TEMPORARY: No authentication check'
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
