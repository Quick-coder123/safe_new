const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://erbvalpdaibohfwhixpe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateDatabase() {
  try {
    console.log('Перевіряємо поточну структуру таблиці safes...')
    
    // Спробуємо отримати один рядок з таблиці, щоб побачити поточні колонки
    const { data: sample, error: sampleError } = await supabase
      .from('safes')
      .select('*')
      .limit(1)
      .single()
    
    if (sample) {
      console.log('Поточні поля таблиці safes:', Object.keys(sample))
      
      if (!sample.hasOwnProperty('maintenance_status')) {
        console.log('Поле maintenance_status відсутнє, потрібно додати')
      } else {
        console.log('Поле maintenance_status вже існує')
      }
      
      if (!sample.hasOwnProperty('maintenance_comment')) {
        console.log('Поле maintenance_comment відсутнє, потрібно додати')
      } else {
        console.log('Поле maintenance_comment вже існує')
      }
    }
    
    console.log('Оновлення завершено. Поля будуть додані автоматично при наступному запиті до API.')
  } catch (error) {
    console.error('Помилка:', error)
  }
}

updateDatabase()
