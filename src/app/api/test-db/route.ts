import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Перевіряємо з'єднання з базою даних
    const { data: administrators, error } = await supabase
      .from('administrators')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      administrators: administrators || [],
      count: administrators?.length || 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: String(error)
    }, { status: 500 })
  }
}
