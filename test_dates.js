// Тест розрахунку дат
const { calculateDays } = require('./src/utils/calculator.ts');

// Тестовий сценарій з проблемою
const startDate = new Date('2025-08-27'); // 27.08.2025
const termDays = 182;

// Поточна логіка розрахунку кінцевої дати з handleTermDaysChange
const endDateCurrent = new Date(startDate.getTime() + (termDays - 1) * 24 * 60 * 60 * 1000);

console.log('Початкова дата:', startDate.toLocaleDateString('uk-UA'));
console.log('Термін:', termDays, 'днів');
console.log('Кінцева дата (поточна логіка):', endDateCurrent.toLocaleDateString('uk-UA'));

// Розрахунок днів за поточною функцією calculateDays
const calculatedDays = calculateDays(startDate, endDateCurrent);
console.log('Розрахована кількість днів:', calculatedDays);

console.log('\n--- Аналіз проблеми ---');
console.log('Очікуваний термін:', termDays);
console.log('Фактичний розрахований термін:', calculatedDays);
console.log('Різниця:', calculatedDays - termDays);

// Правильна кінцева дата
const correctEndDate = new Date(startDate.getTime() + (termDays - 1) * 24 * 60 * 60 * 1000);
console.log('\n--- Правильний розрахунок ---');
console.log('Правильна кінцева дата:', correctEndDate.toLocaleDateString('uk-UA'));

// Перевірка разниці днів між датами без +1
const diffTime = correctEndDate.getTime() - startDate.getTime();
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
console.log('Різниця між датами (без +1):', diffDays);
console.log('Різниця між датами (з +1):', diffDays + 1);
