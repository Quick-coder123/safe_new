import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Inspecting settings table structure...')

    // Спробуємо отримати дані з різними наборами полів
    const attempts = [
      // Спроба 1: Всі поля
      { fields: '*', label: 'All fields' },
      // Спроба 2: Тільки ID
      { fields: 'id', label: 'ID only' },
      // Спроба 3: key-value структура
      { fields: 'id,key,value', label: 'Key-value structure' },
      // Спроба 4: Прямі поля
      { fields: 'id,trust_document_price,package_price,guarantee_amount', label: 'Direct fields' }
    ]

    const results = []

    for (const attempt of attempts) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select(attempt.fields)

        results.push({
          attempt: attempt.label,
          fields: attempt.fields,
          success: !error,
          data: data,
          error: error?.message,
          count: data?.length || 0
        })
      } catch (err) {
        results.push({
          attempt: attempt.label,
          fields: attempt.fields,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Також спробуємо описати структуру таблиці через метадані
    let tableInfo = null
    try {
      // Це не спрацює в Supabase, але залишимо для повноти
      const { data: metadata } = await supabase
        .from('settings')
        .select('*')
        .limit(0)
      
      tableInfo = metadata
    } catch (err) {
      console.log('Could not get table metadata')
    }

    return NextResponse.json({
      tableName: 'settings',
      attempts: results,
      tableInfo,
      summary: {
        successfulAttempts: results.filter(r => r.success).length,
        totalAttempts: results.length,
        recommendation: results.find(r => r.success && (r.count || 0) > 0)?.attempt || 'None successful with data'
      }
    })

  } catch (error) {
    console.error('❌ Inspection error:', error)
    return NextResponse.json({
      error: 'Failed to inspect table structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
