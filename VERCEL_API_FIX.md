# 🔧 Виправлення проблем API на Vercel

## ❌ **Проблема:**
API ендпоінти `/api/administrators` та `/api/save-settings` повертають статус 500 на Vercel.

## 🔍 **Діагностика:**

### 1. **Перевірте environment variables на Vercel:**

Перейдіть до вашого проекту на [vercel.com](https://vercel.com):
1. **Settings** → **Environment Variables**
2. Переконайтеся, що є ці змінні:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiI...
   ```

### 2. **Тест підключення:**
Відкрийте: `https://your-vercel-app.vercel.app/api/test-db`

**Якщо побачите:**
```json
{
  "success": false,
  "error": "Environment variables not configured"
}
```
→ **Проблема**: Не налаштовані environment variables

**Якщо побачите:**
```json
{
  "success": false,
  "error": "Database connection failed"
}
```
→ **Проблема**: Невірні credentials або проблеми з мережею

---

## ✅ **Рішення:**

### **Крок 1: Додайте Environment Variables**

1. **Отримайте Supabase credentials:**
   - Перейдіть в [supabase.com](https://supabase.com)
   - Оберіть ваш проект
   - Settings → API
   - Скопіюйте:
     - **Project URL**
     - **anon/public key**

2. **Додайте в Vercel:**
   - Settings → Environment Variables → Add New
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environment**: Production, Preview, Development
   
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiI...` (ваш ключ)
   - **Environment**: Production, Preview, Development

### **Крок 2: Redeploy**

1. **Deployments** → оберіть останній deployment
2. **"..."** → **Redeploy**
3. Дочекайтеся завершення

### **Крок 3: Перевірка**

1. Відкрийте `/api/test-db` на вашому сайті
2. Повинні побачити:
   ```json
   {
     "success": true,
     "administrators": [...],
     "count": 1
   }
   ```

---

## 🚨 **Поширені помилки:**

### 1. **Використовуєте service_role key замість anon key**
- ❌ Неправильно: `service_role` key
- ✅ Правильно: `anon/public` key

### 2. **Не вибрали всі Environment**
- Переконайтеся, що обрали: Production, Preview, Development

### 3. **Забули зробити Redeploy**
- Після додавання variables обов'язково зробіть redeploy

---

## 📋 **Чек-лист діагностики:**

- [ ] Environment variables додані в Vercel
- [ ] Використовується правильний anon key (не service_role)
- [ ] Зроблено redeploy після додавання variables
- [ ] `/api/test-db` повертає success: true
- [ ] База даних містить таблицю administrators
- [ ] Supabase проект активний

---

**Після виправлення адмін панель повинна працювати повністю! 🎯**
