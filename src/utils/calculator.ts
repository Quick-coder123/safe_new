// Типи даних
export interface SafeCategory {
  id: string;
  name: string;
  rates: {
    up_to_30: number;
    from_31_to_90: number;
    from_91_to_180: number;
    from_181_to_365: number;
  };
}

export interface InsuranceRate {
  min_days: number;
  max_days: number;
  price: number;
}

export interface CalculationInput {
  category: string;
  contractType: 'new' | 'extension';
  coverageType: 'insurance' | 'guarantee';
  startDate: Date;
  endDate: Date;
  penalty: number;
  trustDocuments: number;
  packages: number;
}

export interface CalculationResult {
  days: number;
  safeRate: number;
  safeCost: number;
  insurance: number;
  guarantee: number;
  trustDocumentsCost: number;
  packagesCost: number;
  penalty: number;
  totalCost: number;
  isWeekend: boolean;
}

// Тарифи на сейфи (грн/день, з ПДВ)
export const SAFE_CATEGORIES: SafeCategory[] = [
  {
    id: 'I',
    name: 'І категорія',
    rates: {
      up_to_30: 39.00,
      from_31_to_90: 25.00,
      from_91_to_180: 22.00,
      from_181_to_365: 20.00,
    },
  },
  {
    id: 'II',
    name: 'ІІ категорія',
    rates: {
      up_to_30: 51.00,
      from_31_to_90: 26.00,
      from_91_to_180: 24.00,
      from_181_to_365: 22.00,
    },
  },
  {
    id: 'III',
    name: 'ІІІ категорія',
    rates: {
      up_to_30: 63.00,
      from_31_to_90: 28.00,
      from_91_to_180: 26.00,
      from_181_to_365: 24.00,
    },
  },
  {
    id: 'IV',
    name: 'ІV категорія',
    rates: {
      up_to_30: 63.00,
      from_31_to_90: 35.00,
      from_91_to_180: 33.00,
      from_181_to_365: 29.00,
    },
  },
  {
    id: 'V',
    name: 'V категорія',
    rates: {
      up_to_30: 75.00,
      from_31_to_90: 40.00,
      from_91_to_180: 38.00,
      from_181_to_365: 35.00,
    },
  },
];

// Страхування ключа (грн, без ПДВ)
export const INSURANCE_RATES: InsuranceRate[] = [
  { min_days: 1, max_days: 90, price: 285.00 },
  { min_days: 91, max_days: 180, price: 370.00 },
  { min_days: 181, max_days: 270, price: 430.00 },
  { min_days: 271, max_days: 365, price: 500.00 },
];

// Константи
export const TRUST_DOCUMENT_PRICE = 300; // грн за кожну довіреність
export const PACKAGE_PRICE = 50; // грн за пакет (може бути динамічним)
export const GUARANTEE_AMOUNT = 5000; // грн грошове забезпечення

// Функція для обчислення кількості днів
export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 день згідно ТЗ
}

// Функція для визначення тарифу на основі категорії та терміну
export function getSafeRate(categoryId: string, days: number, categories: SafeCategory[] = SAFE_CATEGORIES): number {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return 0;

  if (days <= 30) return category.rates.up_to_30;
  if (days <= 90) return category.rates.from_31_to_90;
  if (days <= 180) return category.rates.from_91_to_180;
  if (days <= 365) return category.rates.from_181_to_365;
  
  return category.rates.from_181_to_365; // для термінів понад 365 днів
}

// Функція для обчислення вартості страхування
export function getInsurancePrice(days: number, insuranceRates: InsuranceRate[] = INSURANCE_RATES): number {
  const rate = insuranceRates.find(
    rate => days >= rate.min_days && days <= rate.max_days
  );
  return rate ? rate.price : 0;
}

// Перевірка чи є дата вихідним днем
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // неділя або субота
}

// Основна функція калькуляції
export function calculateRental(input: CalculationInput, config?: {
  categories: SafeCategory[];
  insuranceRates: InsuranceRate[];
  settings: any;
}): CalculationResult {
  const days = calculateDays(input.startDate, input.endDate);
  const safeRate = getSafeRate(input.category, days, config?.categories || SAFE_CATEGORIES);
  const safeCost = safeRate * days;
  
  // Страхування ключа (тільки для страхування)
  const insurance = input.coverageType === 'insurance' 
    ? getInsurancePrice(days, config?.insuranceRates || INSURANCE_RATES) 
    : 0;
  
  // Грошове забезпечення (тільки для нових договорів з грошовим забезпеченням)
  const guarantee = input.contractType === 'new' && input.coverageType === 'guarantee'
    ? GUARANTEE_AMOUNT
    : 0;
  
  const trustDocumentsCost = input.trustDocuments * TRUST_DOCUMENT_PRICE;
  const packagesCost = input.packages * PACKAGE_PRICE;
  
  const totalCost = safeCost + insurance + guarantee + trustDocumentsCost + packagesCost + input.penalty;
  
  return {
    days,
    safeRate,
    safeCost,
    insurance,
    guarantee,
    trustDocumentsCost,
    packagesCost,
    penalty: input.penalty,
    totalCost,
    isWeekend: isWeekend(input.endDate),
  };
}

// Форматування дати для відображення
export function formatDate(date: Date): string {
  return date.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Форматування дати для input[type="date"]
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Парсинг дати з input[type="date"]
export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}
