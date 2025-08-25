// Date utilities
export const formatDate = (date: Date, locale = 'it-IT'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatDateTime = (date: Date, locale = 'it-IT'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getWeekNumber = (date: Date): string => {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export const getMonthPeriod = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Number utilities
export const formatNumber = (num: number, locale = 'it-IT'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatCurrency = (amount: number, currency = 'EUR', locale = 'it-IT'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const roundToDecimals = (num: number, decimals = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// CO2 calculation utilities
export const calculateCO2Impact = (
  activityType: string,
  subtype: string,
  quantity: number,
  metadata?: Record<string, unknown>
): number => {
  // This is a simplified calculation - in production, this would use the factors from constants
  // and more complex logic based on activity type and metadata
  
  const baseFactors: Record<string, number> = {
    'commute-car': 0.21,
    'commute-bus': 0.08,
    'commute-bike': 0,
    'commute-walk': 0,
    'meal-meat': 3.3,
    'meal-veg': 1.7,
    'recycle-plastic': -0.5, // Negative because it saves CO2
    'energy-kwh': 0.47,
  };
  
  const key = `${activityType}-${subtype}`;
  const factor = baseFactors[key] || 0;
  
  // If metadata includes distance for commute, use it
  if (activityType === 'commute' && metadata?.distanceKm) {
    return factor * (metadata.distanceKm as number);
  }
  
  return factor * quantity;
};

// Points calculation utilities
export const calculatePoints = (co2Saved: number, activityType: string): number => {
  // Base points for CO2 saved (1 point per 100g CO2 saved)
  const basePoints = Math.floor(co2Saved * 10);
  
  // Bonus points for specific activity types
  const bonusFactors: Record<string, number> = {
    commute: 1.2,
    meal: 1.5,
    recycle: 2.0,
    energy: 1.0,
  };
  
  const bonus = bonusFactors[activityType] || 1.0;
  return Math.floor(basePoints * bonus);
};
