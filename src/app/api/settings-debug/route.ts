import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug Settings API: Fetching settings...')
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()

    if (error) {
      console.error('❌ Settings error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch settings', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Settings fetched successfully')
    
    return NextResponse.json({ 
      settings: data,
      debug: {
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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Save Settings API: Starting...')
    
    const body = await request.json()
    console.log('📝 Received settings:', body)

    // ТИМЧАСОВО: Зберігаємо без перевірки аутентифікації
    const { data, error } = await supabase
      .from('settings')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('❌ Save error:', error)
      return NextResponse.json({ 
        error: 'Failed to save settings', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Settings saved successfully')
    
    return NextResponse.json({ 
      success: true, 
      settings: data,
      debug: {
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
