# Налаштування та деплой

Технічне завдання проєкту — у [`README.md`](../README.md). Цей документ описує, як запустити та розгорнути застосунок.

## 1. Змінні середовища

Скопіюйте `.env.example` у `.env.local` і заповніть:

| Змінна | Де взяти | Призначення |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | URL проєкту |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | там само, `anon public` | публічний ключ (лише читання тарифів) |
| `SUPABASE_SERVICE_ROLE_KEY` | там само, `service_role` | **секрет**, використовується тільки серверними API |
| `SESSION_SECRET` | згенерувати самостійно | підпис сесійних cookie адміністраторів (≥ 32 символи) |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

У Vercel ці ж змінні додаються в **Project Settings → Environment Variables**. Без `SESSION_SECRET` у production вхід в адмінку не працюватиме (свідомо).

Якщо Supabase не налаштовано, калькулятор працює в демо-режимі з тарифами за замовчуванням із ТЗ (`src/config/defaults.ts`).

## 2. База даних

- **Новий проєкт:** виконайте `database/schema.sql` у Supabase → SQL Editor.
- **Наявна база:** виконайте міграції з `database/migrations/` по порядку (`001_security_hardening.sql` — вмикає RLS, прибирає відкриті політики, створює журнал змін `admin_audit_log`).

Після міграції браузер не має прямого доступу на запис у базу: усі зміни проходять через серверні API з перевіркою сесії.

## 3. Перший адміністратор

Відкрийте `/create-admin` — сторінка працює лише поки таблиця `administrators` порожня. Далі адміністраторів додає супер-адміністратор у вкладці «Адміністратори»; новому адміністратору видається тимчасовий пароль, який потрібно змінити при першому вході.

## 4. Розробка

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # юніт-тести (Vitest)
npm run typecheck
npm run lint
npm run build
```

CI (`.github/workflows/ci.yml`) запускає lint, typecheck, тести та build на кожен push і PR.

## 5. Архітектура безпеки

- Сесія — HMAC-підписаний токен у httpOnly cookie (`src/lib/session.ts`), термін дії 8 годин.
- `src/middleware.ts` відхиляє запити до непублічних `/api/*` без валідної сесії та перевіряє `Origin` для запитів, що змінюють дані.
- Кожен обробник додатково викликає `requireAdmin()` (`src/lib/auth.ts`): перевіряє, що адміністратор ще існує, його роль та чи не тимчасовий пароль.
- Публічні маршрути: `GET /api/get-settings`, `POST /api/admin-login`, `/api/admin-session`, `/api/create-admin` (лише для порожньої бази).
- Вхід обмежено 10 спробами за 15 хвилин з однієї IP-адреси.
- Усі зміни тарифів, адміністраторів і сейфів записуються в журнал (вкладка «Журнал змін»).
