import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Migrating settings table structure...')

    // Спочатку перевіримо поточну структуру
    const { data: currentSettings, error: fetchError } = await supabase
      .from('settings')
      .select('*')

    console.log('📊 Current settings:', currentSettings)

    if (fetchError) {
      console.error('❌ Error fetching current settings:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch current settings',
        details: fetchError.message 
      }, { status: 500 })
    }

    // Якщо це key-value структура, переробляємо її
    if (currentSettings && currentSettings.length > 0 && currentSettings[0].key) {
      console.log('🔄 Converting from key-value to direct structure...')
      
      // Збираємо значення з key-value
      const settingsObj: any = { id: 1 }
      currentSettings.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value
      })

      // Додаємо дефолтні значення для полів, яких може не бути
      if (!settingsObj.trust_document_price) settingsObj.trust_document_price = '300'
      if (!settingsObj.package_price) settingsObj.package_price = '50'
      if (!settingsObj.guarantee_amount) settingsObj.guarantee_amount = '5000'

      console.log('📝 New settings object:', settingsObj)

      // Видаляємо всі старі записи
      const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .neq('id', 0)

      if (deleteError) {
        console.error('❌ Error deleting old settings:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to delete old settings',
          details: deleteError.message 
        }, { status: 500 })
      }

      // Створюємо новий запис з правильною структурою
      const { data: newSettings, error: insertError } = await supabase
        .from('settings')
        .insert([settingsObj])
        .select()

      if (insertError) {
        console.error('❌ Error inserting new settings:', insertError)
        // Якщо помилка через відсутність стовпців, створимо простішу структуру
        if (insertError.message.includes('column') || insertError.message.includes('schema')) {
          console.log('🔧 Creating minimal settings structure...')
          
          // Створюємо мінімальний запис тільки з існуючими полями
          const { data: minimalSettings, error: minimalError } = await supabase
            .from('settings')
            .insert([{ id: 1 }])
            .select()

          if (minimalError) {
            console.error('❌ Error creating minimal settings:', minimalError)
            return NextResponse.json({ 
              error: 'Failed to create settings',
              details: minimalError.message 
            }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            message: 'Minimal settings structure created',
            data: minimalSettings,
            note: 'Some columns may need to be added to the database schema'
          })
        }
        
        return NextResponse.json({ 
          error: 'Failed to insert new settings',
          details: insertError.message 
        }, { status: 500 })
      }

      console.log('✅ Settings structure migrated successfully')
      return NextResponse.json({
        success: true,
        message: 'Settings structure migrated from key-value to direct',
        data: newSettings
      })

    } else if (!currentSettings || currentSettings.length === 0) {
      console.log('📝 Creating default settings...')
      
      // Створюємо дефолтні налаштування
      const defaultSettings = {
        id: 1,
        trust_document_price: '300',
        package_price: '50',
        guarantee_amount: '5000'
      }

      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert([defaultSettings])
        .select()

      if (createError) {
        console.error('❌ Error creating default settings:', createError)
        
        // Якщо помилка через відсутність стовпців, спробуємо мінімальну структуру
        if (createError.message.includes('column') || createError.message.includes('schema')) {
          const { data: minimalSettings, error: minimalError } = await supabase
            .from('settings')
            .insert([{ id: 1 }])
            .select()

          if (minimalError) {
            return NextResponse.json({ 
              error: 'Failed to create any settings',
              details: minimalError.message 
            }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            message: 'Minimal settings created - database schema needs updating',
            data: minimalSettings,
            missingColumns: ['trust_document_price', 'package_price', 'guarantee_amount']
          })
        }

        return NextResponse.json({ 
          error: 'Failed to create default settings',
          details: createError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Default settings created',
        data: newSettings
      })

    } else {
      console.log('✅ Settings already in correct format')
      return NextResponse.json({
        success: true,
        message: 'Settings already in correct format',
        data: currentSettings
      })
    }

  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
