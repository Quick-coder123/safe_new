# Інструкція з підключення до Supabase

## 🔗 Налаштування бази даних

Ваша база даних Supabase успішно підключена до проєкту!

**URL:** https://erbvalpdaibohfwhixpe.supabase.co
**Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI

## 📋 Наступні кроки:

### 1. Виконати SQL скрипт у Supabase
1. Перейдіть до [Supabase Dashboard](https://supabase.com/dashboard)
2. Оберіть ваш проєкт (erbvalpdaibohfwhixpe)
3. Перейдіть у розділ "SQL Editor"
4. Створіть новий запит
5. Скопіюйте весь вміст файлу `database/schema.sql` та виконайте його

### 2. Налаштувати авторизацію (опціонально)
Для доступу до адмін-панелі:
1. У Supabase Dashboard → Authentication → Users
2. Створіть нового користувача або використайте існуючого
3. Зайдіть у додаток за адресою `/admin` та авторизуйтесь

### 3. Перевірити роботу
- Відкрийте http://localhost:3000
- Калькулятор повинен працювати з даними з бази
- Адмін-панель доступна за адресою http://localhost:3000/admin

## 🔍 Структура створених таблиць:

✅ **safe_categories** - категорії сейфів (I, II, III, IV, V) з тарифами
✅ **insurance_rates** - тарифи страхування ключа по термінах
✅ **settings** - налаштування (ціни довіреностей, реквізити компанії)
✅ **change_logs** - журнал змін для аудиту

## 🛡️ Налаштування безпеки (RLS):
- Анонімні користувачі: тільки читання
- Авторизовані користувачі: повний доступ
- Журнал змін: тільки читання для авторизованих

## 📊 Початкові дані:
Скрипт автоматично створить:
- 5 категорій сейфів з тарифами згідно ТЗ
- 4 рівні страхування ключа
- Базові налаштування компанії
