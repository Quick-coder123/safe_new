const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Читаємо SQL скрипт
const sql = fs.readFileSync('./database/add_maintenance_fields.sql', 'utf8')

// Створюємо клієнт Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateDatabase() {
  try {
    console.log('Оновлюємо схему бази даних...')
    
    // Виконуємо SQL запити один за одним
    const queries = sql.split(';').filter(query => query.trim().length > 0)
    
    for (const query of queries) {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query.trim() })
      if (error) {
        console.log('Помилка:', error.message)
        // Можливо, поля вже існують, тому продовжуємо
      } else {
        console.log('Запит виконано успішно')
      }
    }
    
    console.log('Оновлення бази даних завершено!')
  } catch (error) {
    console.error('Помилка при оновленні бази даних:', error)
  }
}

updateDatabase()
