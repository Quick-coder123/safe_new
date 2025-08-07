import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// POST - Додати поля maintenance_status та maintenance_comment до таблиці safes
export async function POST() {
  try {
    const supabase = createSupabaseClient()
    
    // Спробуємо додати поля до таблиці safes
    console.log('Спроба додавання полів maintenance_status та maintenance_comment...')
    
    // Спочатку перевіримо, чи поля вже існують
    const { data: sample, error: sampleError } = await supabase
      .from('safes')
      .select('*')
      .limit(1)
      .single()
    
    if (sample) {
      const hasMaintenanceStatus = sample.hasOwnProperty('maintenance_status')
      const hasMaintenanceComment = sample.hasOwnProperty('maintenance_comment')
      
      console.log('Поточні поля:', Object.keys(sample))
      console.log('maintenance_status існує:', hasMaintenanceStatus)
      console.log('maintenance_comment існує:', hasMaintenanceComment)
      
      if (hasMaintenanceStatus && hasMaintenanceComment) {
        return NextResponse.json({ 
          message: 'Поля вже існують в таблиці safes',
          fields: Object.keys(sample)
        })
      }
    }

    return NextResponse.json({ 
      message: 'Перевірка завершена',
      currentFields: sample ? Object.keys(sample) : []
    })
  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json(
      { error: 'Помилка перевірки бази даних' },
      { status: 500 }
    )
  }
}
