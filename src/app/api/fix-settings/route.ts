import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Fixing settings table structure...')

    // Спочатку перевіримо поточну структуру
    const { data: currentData, error: currentError } = await supabase
      .from('settings')
      .select('*')

    console.log('📊 Current settings data:', currentData)

    if (currentError) {
      console.log('❌ Current error:', currentError)
    }

    // Якщо таблиця має key-value структуру, збираємо значення
    let settingsToSave: any = {
      trust_document_price: '300',
      package_price: '50', 
      guarantee_amount: '5000'
    }

    if (currentData && currentData.length > 0) {
      if (currentData[0].key) {
        // Key-value структура - збираємо значення
        console.log('🔄 Converting from key-value structure')
        currentData.forEach((row: any) => {
          if (row.key && row.value) {
            settingsToSave[row.key] = row.value
          }
        })
      } else {
        // Пряма структура - використовуємо як є
        console.log('✅ Already direct structure')
        const { id, created_at, updated_at, ...directSettings } = currentData[0]
        settingsToSave = { ...settingsToSave, ...directSettings }
      }
    }

    console.log('💾 Settings to save:', settingsToSave)

    // Видаляємо всі існуючі записи
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .neq('id', 0)

    if (deleteError) {
      console.log('⚠️ Delete error (expected if table is empty):', deleteError.message)
    }

    // Спробуємо зберегти з повною структурою
    const fullSettings = {
      id: 1,
      ...settingsToSave
    }

    const { data: savedData, error: saveError } = await supabase
      .from('settings')
      .insert([fullSettings])
      .select()

    if (saveError) {
      console.log('❌ Save error with full structure:', saveError.message)
      
      // Якщо помилка через відсутність колонок, спробуємо тільки з id
      const { data: minimalData, error: minimalError } = await supabase
        .from('settings')
        .insert([{ id: 1 }])
        .select()

      if (minimalError) {
        return NextResponse.json({
          success: false,
          error: 'Could not create settings record',
          details: minimalError.message,
          suggestion: 'Table structure needs to be updated in Supabase'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Minimal settings created',
        data: minimalData,
        warning: 'Full settings could not be saved - database schema needs columns: trust_document_price, package_price, guarantee_amount'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings structure fixed successfully',
      data: savedData
    })

  } catch (error) {
    console.error('❌ Fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix settings structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
