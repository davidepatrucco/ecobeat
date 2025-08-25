// Constants
export const APP_CONFIG = {
  APP_NAME: 'Ecobeat',
  APP_VERSION: '1.0.0',
  API_VERSION: 'v1',
  DEFAULT_LOCALE: 'it-IT',
  SUPPORTED_LOCALES: ['it-IT', 'en-US'],
} as const;

export const CO2_FACTORS = {
  // Transportation (kg CO2 per km)
  CAR_PETROL: 0.21,
  CAR_DIESEL: 0.17,
  BUS: 0.08,
  TRAIN: 0.04,
  BIKE: 0,
  WALK: 0,
  
  // Food (kg CO2 per meal)
  MEAT_MEAL: 3.3,
  VEGETARIAN_MEAL: 1.7,
  VEGAN_MEAL: 0.9,
  
  // Energy (kg CO2 per kWh)
  ELECTRICITY_IT: 0.47,
} as const;

export const POINTS_CONFIG = {
  // Points awarded for activities
  BIKE_TRIP: 10,
  WALK_TRIP: 5,
  PUBLIC_TRANSPORT: 8,
  VEGETARIAN_MEAL: 15,
  VEGAN_MEAL: 20,
  RECYCLE_ACTION: 5,
  
  // Challenge completion bonuses
  DAILY_CHALLENGE: 50,
  WEEKLY_CHALLENGE: 200,
  MONTHLY_CHALLENGE: 500,
} as const;

export const BADGES = {
  ECO_STARTER: 'Eco Starter',
  ECO_WARRIOR: 'Eco Warrior',
  ECO_CHAMPION: 'Eco Champion',
  ECO_MASTER: 'Eco Master',
  BIKE_LOVER: 'Bike Lover',
  GREEN_EATER: 'Green Eater',
  RECYCLING_HERO: 'Recycling Hero',
} as const;

export const LEVELS = {
  STARTER: { name: 'Eco Starter', minPoints: 0 },
  EXPLORER: { name: 'Eco Explorer', minPoints: 500 },
  WARRIOR: { name: 'Eco Warrior', minPoints: 1500 },
  CHAMPION: { name: 'Eco Champion', minPoints: 5000 },
  MASTER: { name: 'Eco Master', minPoints: 10000 },
} as const;

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  REWARD_OUT_OF_STOCK: 'REWARD_OUT_OF_STOCK',
  CHALLENGE_NOT_ACTIVE: 'CHALLENGE_NOT_ACTIVE',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;
