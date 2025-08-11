const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jprpdfjvhfgcbdyqtobp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcnBkZmp2aGZnY2JkeXF0b2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Mzk5MTgsImV4cCI6MjA1MjExNTkxOH0.WL_WQNGdWCFZWUleSPyxKPKgLd5fgmcAYYKkz3iE21M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAdmin() {
  try {
    console.log('🔄 Створюємо тестового адміністратора з тимчасовим паролем...');
    
    const tempPassword = 'temp123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Видаляємо попереднього тестового адміністратора, якщо існує
    await supabase
      .from('administrators')
      .delete()
      .eq('login', 'testadmin');
    
    // Створюємо нового тестового адміністратора
    const { data, error } = await supabase
      .from('administrators')
      .insert([
        {
          login: 'testadmin',
          password_hash: hashedPassword,
          role: 'admin',
          is_temp_password: true,
          created_by: 'system'
        }
      ])
      .select();

    if (error) {
      console.error('❌ Помилка створення тестового адміністратора:', error);
      return;
    }

    console.log('✅ Тестовий адміністратор створений успішно!');
    console.log('📋 Дані для входу:');
    console.log('   Логін: testadmin');
    console.log('   Пароль: temp123');
    console.log('   Статус: тимчасовий пароль (is_temp_password: true)');
    console.log('');
    console.log('🧪 Тепер можна протестувати примусову зміну пароля:');
    console.log('1. Перейдіть на http://localhost:3000');
    console.log('2. Натисніть "Увійти" і введіть дані вище');
    console.log('3. Після входу повинно автоматично відкритися модальне вікно зміни пароля');
    
  } catch (error) {
    console.error('❌ Помилка:', error);
  }
}

createTestAdmin();
