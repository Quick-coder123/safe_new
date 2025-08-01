# 🚀 Завершення конфігурації Vercel

## Поточний стан
✅ Деплой успішний  
⚠️ Потрібно додати змінні середовища Supabase

## Кроки для завершення конфігурації:

### 1. Перейдіть в налаштування проекту Vercel

1. Відкрийте [vercel.com](https://vercel.com/dashboard)
2. Знайдіть свій проект `safe_new` 
3. Натисніть на проект
4. Перейдіть на вкладку **Settings**
5. В меню зліва оберіть **Environment Variables**

### 2. Додайте змінні середовища

Додайте ці **2 змінні**:

#### Змінна 1:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://erbvalpdaibohfwhixpe.supabase.co
Environment: Production, Preview, Development (всі три галочки)
```

#### Змінна 2:
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI
Environment: Production, Preview, Development (всі три галочки)
```

### 3. Перезапустіть деплой

1. Після додавання змінних перейдіть на вкладку **Deployments**
2. Знайдіть останній деплой (зверху списку)
3. Натисніть **три крапки** поруч з деплоєм
4. Оберіть **Redeploy**
5. Підтвердіть редеплой

### 4. Результат

Після успішного редеплою:
- ✅ Сторінка "Конфігурація не завершена" зникне
- ✅ З'явиться повноцінний калькулятор оренди сейфу
- ✅ Буде доступна адмін-панель

## Важлива інформація

⚠️ **Перше використання:**
1. Перейдіть на `yourproject.vercel.app/create-admin`
2. Створіть першого супер-адміністратора
3. Увійдіть в адмін-панель через `yourproject.vercel.app/admin`

## Структура проекту

- `/` - головна сторінка з калькулятором
- `/admin` - адмін-панель для управління тарифами
- `/create-admin` - створення першого адміністратора

## Альтернативний спосіб (через Vercel CLI)

Якщо у вас встановлений Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Введіть: https://erbvalpdaibohfwhixpe.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Введіть: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnZhbHBkYWlib2hmd2hpeHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjYwMTksImV4cCI6MjA2ODk0MjAxOX0.pskoRXUVRTc5_gIcb0oV5u78pwcRjtfXbmY2TGz1TTI

vercel --prod  # Перезапустить продакшн деплой
```
