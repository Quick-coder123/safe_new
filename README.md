Цей файл не замінювати, не переписувати та не видаляти ні за яких умов, орінтуватись виключно на ТЗ яки описано в даному тексті, моніторити якщо будуть відбуватись зміни та реагувати на них.

🔐 Safe Rental Calculator – Web App
🎯 Ціль проєкту
Розробити веб-додаток для розрахунку вартості оренди індивідуального сейфу з підтримкою:

динамічних тарифів,

генерації реквізитів для оплати,

підсумкової калькуляції суми,

адмін-панелі для редагування тарифів.

Хостинг – Vercel
База даних – Supabase

/pages
  index.tsx              - головна сторінка з калькулятором
  /admin
    index.tsx            - адмін-панель (доступ лише авторизованим)
  /api
    get-settings.ts      - API для отримання тарифів
    save-settings.ts     - API для збереження тарифів

/public
  /icons
  /favicon.ico

/styles
  globals.css

/utils
  calculator.ts          - логіка обчислення вартості

/database
  schema.sql             - структура таблиць тарифів, покриття, довіреностей

.env.local               - конфіденційні ключі Supabase


🧮 Калькулятор оренди сейфу
Вхідні дані користувача:
Категорія сейфу: I – V

Тип договору: Новий або Пролонгація

Тип покриття: Страхування ключа або Грошове забезпечення

Дата початку (вибір з календаря)

Дата закінчення (вибір з календаря)

Термін (вираховується автоматично, у днях)

Пеня (грн, опціонально)

Кількість довіреностей (0+)

Кількість пакетів (0+)

Кнопка: Оформити страхування ключа

🔢 Розрахунки:
Автоматичне:
Дата закінчення = Дата початку + Термін (відображати попередження якщо вихідний день!!)

Термін = дата_кінця – дата_початку + 1 день

Вартість сейфу = тариф_за_день * кількість_днів

Страхування ключа = згідно таблиці

Вартість довіреностей = 300 грн * кількість

Вартість пакетів = фіксовано або динамічно (вказується в адмінці)

Підсумкова сума = сума всіх компонентів

📊 Тарифні таблиці
1. Тарифи на сейфи (грн/день, з ПДВ)

І категорія
до 30 днів - 39,00 грн/день
від 31 до 90 днів - 25,00 грн/день
від 91 до 180 днів - 22,00 грн/день
від 181 до 365 днів - 20,00 грн/день


ІІ категорія
до 30 днів - 51,00 грн/день
від 31 до 90 днів - 26,00 грн/день
від 91 до 180 днів - 24,00 грн/день
від 181 до 365 днів - 22,00 грн/день


ІІІ категорія
до 30 днів - 63,00 грн/день
від 31 до 90 днів - 28,00 грн/день
від 91 до 180 днів - 26,00 грн/день
від 181 до 365 днів - 24,00 грн/день


ІV категорія
до 30 днів - 63,00 грн/день
від 31 до 90 днів - 35,00 грн/день
від 91 до 180 днів - 33,00 грн/день
від 181 до 365 днів - 29,00 грн/день


Тариф обирається автоматично на основі терміну і категорії.

2. Страхування ключа (грн, без ПДВ)
Термін (днів)	Вартість
до 90	285.00
91 – 180	370.00
181 – 270	430.00
271 – 365	500.00

3. Довіреності
300 грн за кожну (250 грн + 50 грн ПДВ)

📋 Реквізити
Отримувач (ПІБ)

Код ЄДРПОУ

IBAN

UA + контрольна сума (29 цифр)

Призначення платежу (посилання або текст)

Дії:
Згенерувати реквізити

Скопіювати

🛠️ Адмін-панель
Тільки для авторизованих користувачів

Авторизація через Supabase Auth (email/password)

Редагування:

Тарифів по категоріях

Страхових сум

Вартості довіреностей

Вартості пакетів

Призначення платежу

Додавання нових категорій

Перегляд журналу змін

🔐 Авторизація
index.tsx: доступний для всіх

/admin: тільки авторизовані адміністратори

🌐 Інтерфейс
Повна підтримка української мови

Адаптивний дизайн (мобільні/десктоп)

Tailwind CSS для швидкої верстки

📈 Функціональність
Реактивне оновлення підсумкової інформації при зміні будь-якого поля

Перевірка всіх обов'язкових полів перед генерацією

Автоматичний підрахунок терміну оренди

Динамічний розрахунок підсумкової вартості

🚀 Хостинг
Проєкт буде розгорнутий на Vercel

CI/CD підтримка з GitHub (опційно)# Vercel sync Fri Aug  1 13:29:00 UTC 2025
