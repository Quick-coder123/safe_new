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

// Функція для обчислення кількості днів
export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 день згідно ТЗ
}

// Функція для визначення тарифу на основі категорії та терміну
export function getSafeRate(categoryId: string, days: number, categories: SafeCategory[]): number {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return 0;

  if (days <= 30) return category.rates.up_to_30;
  if (days <= 90) return category.rates.from_31_to_90;
  if (days <= 180) return category.rates.from_91_to_180;
  if (days <= 365) return category.rates.from_181_to_365;
  
  return category.rates.from_181_to_365; // для термінів понад 365 днів
}

// Функція для обчислення вартості страхування
export function getInsurancePrice(days: number, insuranceRates: InsuranceRate[]): number {
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
export function calculateRental(input: CalculationInput, config: {
  categories: SafeCategory[];
  insuranceRates: InsuranceRate[];
  settings: {
    trust_document_price: string;
    package_price: string;
    guarantee_amount: string;
    [key: string]: string;
  };
}): CalculationResult {
  const days = calculateDays(input.startDate, input.endDate);
  const safeRate = getSafeRate(input.category, days, config.categories);
  const safeCost = safeRate * days;
  
  // Страхування ключа (тільки для страхування)
  const insurance = input.coverageType === 'insurance' 
    ? getInsurancePrice(days, config.insuranceRates) 
    : 0;
  
  // Грошове забезпечення (тільки для нових договорів з грошовим забезпеченням)
  const guaranteeAmount = parseFloat(config.settings.guarantee_amount) || 0;
  const guarantee = input.contractType === 'new' && input.coverageType === 'guarantee'
    ? guaranteeAmount
    : 0;
  
  const trustDocumentPrice = parseFloat(config.settings.trust_document_price) || 0;
  const packagePrice = parseFloat(config.settings.package_price) || 0;
  
  const trustDocumentsCost = input.trustDocuments * trustDocumentPrice;
  const packagesCost = input.packages * packagePrice;
  
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
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Форматування дати для відображення (День/Місяць/Рік)
export function formatDateForDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Парсинг дати з input[type="date"]
export function parseDateFromInput(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
