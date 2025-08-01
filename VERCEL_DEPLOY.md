# Інструкція для деплою на Vercel

## Налаштування змінних середовища

Для успішного деплою проекту на Vercel потрібно додати змінні середовища в налаштуваннях проекту.

### Крок 1: Перейдіть в налаштування проекту на Vercel

1. Відкрийте свій проект на [vercel.com](https://vercel.com)
2. Перейдіть на вкладку **Settings** 
3. Натисніть **Environment Variables**

### Крок 2: Додайте наступні змінні середовища

Додайте ці змінні з їх значеннями:

```
NEXT_PUBLIC_SUPABASE_URL=https://erbvalpdaibohfwhixpe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI
```

### Крок 3: Налаштування для всіх середовищ

Для кожної змінної оберіть наступні середовища:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Крок 4: Повторний деплой

Після додавання змінних середовища:
1. Перейдіть на вкладку **Deployments**
2. Знайдіть останній деплой
3. Натисніть кнопку **Redeploy** (три крапки → Redeploy)

## Альтернативний спосіб

Якщо у вас є доступ до Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Перевірка

Після успішного деплою ваш сайт буде доступний за адресою, яку надасть Vercel.

## Важливо

⚠️ **Безпека**: Ці змінні середовища містять публічні ключі Supabase, які призначені для frontend-використання. Вони не містять секретної інформації, але все одно рекомендується обмежити доступ до бази даних через Row Level Security (RLS) в Supabase.

## Структура проекту після деплою

Основні маршрути:
- `/` - головна сторінка з калькулятором
- `/admin` - адмін-панель 
- `/create-admin` - створення першого адміністратора

## Першое налаштування після деплою

1. Перейдіть на `/create-admin` для створення першого супер-адміністратора
2. Увійдіть в адмін-панель `/admin` з створеними даними
3. Налаштуйте тарифи та реквізити в адмін-панелі
