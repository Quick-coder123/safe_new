# 🚨 КРИТИЧНА ПРОБЛЕМА: API 500 на Vercel

## ❌ **Симптоми:**
- Не можна зберегти зміни в тарифах (API 500)
- Не бачу адміністраторів (API 500)
- `/api/administrators` та `/api/save-settings` повертають статус 500

## 🔍 **Причина:**
**Environment variables не налаштовані на Vercel** - система використовує placeholder значення замість реальних Supabase credentials.

---

## ✅ **РІШЕННЯ:**

### **Крок 1: Діагностика**
Відкрийте: `https://your-vercel-app.vercel.app/api/test-db`

**Якщо побачите:**
```json
{
  "success": false,
  "error": "Environment variables not configured"
}
```
→ Переходьте до Кроку 2

### **Крок 2: Налаштування Environment Variables**

1. **Отримайте Supabase credentials:**
   - [supabase.com](https://supabase.com) → ваш проект
   - Settings → API
   - Скопіюйте **Project URL** та **anon/public key**

2. **Додайте в Vercel:**
   - [vercel.com](https://vercel.com) → ваш проект
   - Settings → Environment Variables
   
   **Додайте 2 змінні:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project.supabase.co
   Environment: ✅ Production ✅ Preview ✅ Development
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
   Value: eyJhbGciOiJIUzI1NiI... (ваш anon key)
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

### **Крок 3: Redeploy**
- Deployments → останній deployment → "..." → **Redeploy**

### **Крок 4: Перевірка**
1. Відкрийте `/api/test-db` - повинно бути `"success": true`
2. Перейдіть в адмін панель - адміністратори мають з'явитися
3. Спробуйте зберегти тарифи - має працювати

---

## 🔧 **Покращення діагностики:**

Додано детальні логи в API:
- **Environment variables перевірка**
- **Database connection статус**  
- **Детальні error messages**
- **Логи кожного кроку операцій**

---

## 📋 **Чек-лист:**

- [ ] Environment variables додані в Vercel
- [ ] Обрано всі Environment (Production, Preview, Development)  
- [ ] Використовується **anon** key (НЕ service_role)
- [ ] Зроблено Redeploy після додавання змінних
- [ ] `/api/test-db` повертає success: true
- [ ] Адміністратори відображаються в панелі
- [ ] Тарифи зберігаються без помилок

---

## ⚠️ **Поширені помилки:**

1. **Плутанина ключів:** Використовується service_role замість anon
2. **Неповні Environment:** Не обрано всі типи (Production, Preview, Development)
3. **Відсутній Redeploy:** Забули перезапустити після додавання змінних
4. **Копіювання з пробілами:** Зайві символи в ключах

**Після виправлення все буде працювати! 🎯**
