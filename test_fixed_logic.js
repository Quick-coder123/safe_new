// Тест виправленої логіки
const { calculateDays } = require('./src/utils/calculator.ts');

console.log('=== Тест виправленої логіки ===');

const startDate = new Date('2025-08-27');
console.log('Початкова дата:', startDate.toLocaleDateString('uk-UA'));

// Тест 1: Термін 182 дні
const termDays = 182;
console.log('\nТест 1: Термін', termDays, 'днів');

// Розрахунок кінцевої дати (логіка handleTermDaysChange)
const endDate = new Date(startDate.getTime() + (termDays - 1) * 24 * 60 * 60 * 1000);
console.log('Кінцева дата:', endDate.toLocaleDateString('uk-UA'));

// Зворотний розрахунок (логіка calculateDays)
const calculatedDays = calculateDays(startDate, endDate);
console.log('Розрахований термін:', calculatedDays, 'днів');

console.log('Результат:', termDays === calculatedDays ? '✅ ПРАВИЛЬНО' : '❌ ПОМИЛКА');

// Тест 2: Перевірка конкретних дат
console.log('\n=== Тест конкретних дат ===');
const testDate1 = new Date('2026-02-23'); // Проблемна дата
const testDate2 = new Date('2026-02-24'); // Правильна дата

console.log('27.08.2025 → 23.02.2026:', calculateDays(startDate, testDate1), 'днів');
console.log('27.08.2025 → 24.02.2026:', calculateDays(startDate, testDate2), 'днів');
