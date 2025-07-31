-- Створення адміністратора через SQL (виконати в Supabase SQL Editor)
-- УВАГА: Замініть email та пароль на ваші власні!

-- Спочатка потрібно виконати основну схему з schema.sql
-- Потім можна додати користувача через Dashboard або використати цей запит:

-- Примітка: Користувачі зазвичай створюються через Supabase Auth UI
-- Цей SQL тільки для інформації, рекомендується використовувати Dashboard

-- Перевірка створених таблиць
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('safe_categories', 'insurance_rates', 'settings', 'change_logs');

-- Перевірка початкових даних
SELECT * FROM safe_categories;
SELECT * FROM insurance_rates;
SELECT * FROM settings;
