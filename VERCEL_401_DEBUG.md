# 🔍 ДІАГНОСТИКА: 401 Unauthorized на Vercel

## ❌ **Проблема:**
```
GET https://safe-new.vercel.app/api/administrators 401 (Unauthorized)
```

## 🧪 **Кроки діагностики:**

### **1. Перевірте Environment Variables:**
```
https://your-app.vercel.app/api/test-db
```
**Має показувати:** `"success": true`  
**Якщо ні** → додайте Environment Variables

### **2. Перевірте аутентифікацію:**
```
https://your-app.vercel.app/api/test-auth
```

**Очікуваний результат після входу в систему:**
```json
{
  "success": true,
  "admin": {
    "login": "your-admin",
    "role": "super_admin", 
    "id": 1
  },
  "cookiePresent": true,
  "cookieLength": 25
}
```

**Якщо `"success": false"`:**

#### **A) Немає cookies:**
```json
{
  "success": false,
  "cookiePresent": false,
  "error": "No cookie header"
}
```
→ **Проблема:** Не авторизовані, потрібно увійти в систему

#### **B) Є cookies, але не валідні:**
```json
{
  "success": false,
  "cookiePresent": true,
  "error": "Admin not found"
}
```
→ **Проблема:** База даних або сесія пошкоджена

#### **C) Database configuration error:**
```json
{
  "success": false,
  "error": "Database configuration error"
}
```
→ **Проблема:** Environment variables не налаштовані

---

## ✅ **Рішення залежно від результату:**

### **🔐 Якщо проблема з авторизацією:**

1. **Увійдіть в систему заново:**
   - Перейдіть на `/admin`
   - Введіть логін та пароль
   - Перевірте `/api/test-auth` знову

2. **Якщо логін не працює:**
   - Перейдіть на `/create-admin`
   - Створіть нового super_admin

### **🗄️ Якщо проблема з базою даних:**

1. **Перевірте Environment Variables в Vercel:**
   - Settings → Environment Variables
   - Має бути: `NEXT_PUBLIC_SUPABASE_URL` та `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Перевірте Supabase:**
   - Чи активний проект?
   - Чи правильні credentials?
   - Чи існує таблиця `administrators`?

### **🔧 Якщо проблема з cookies на Vercel:**

Іноді cookies не передаються правильно на Vercel. Перевірте:

1. **Домен cookies** - має відповідати Vercel домену
2. **HTTPS** - cookies мають працювати тільки на HTTPS
3. **SameSite політика**

---

## 🛠️ **Покращена діагностика:**

Тепер у всіх API є детальні логи:
- 🍪 Cookie presence та content
- 🔑 Session validation steps  
- 🗄️ Database query results
- ❌ Detailed error messages

**Перевірте Function Logs у Vercel для детальної інформації!**

---

## 📋 **Чек-лист виправлення:**

- [ ] `/api/test-db` показує `success: true`
- [ ] Environment Variables додані в Vercel
- [ ] Зроблено Redeploy після додавання змінних
- [ ] Авторизація працює на `/admin`
- [ ] `/api/test-auth` показує `success: true`
- [ ] Cookies присутні та валідні
- [ ] Таблиця `administrators` існує та містить записи

**З детальними логами тепер легко знайти точну причину! 🎯**
