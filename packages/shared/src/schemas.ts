import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  locale: z.string().default('it-IT'),
  level: z.string().default('Eco Starter'),
  points: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Activity schemas
export const ActivityTypeSchema = z.enum(['commute', 'meal', 'recycle', 'energy']);
export const ActivitySubtypeSchema = z.enum(['bike', 'car', 'bus', 'walk', 'veg', 'meat', 'plastic', 'paper', 'kwh']);

export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: ActivityTypeSchema,
  subtype: ActivitySubtypeSchema,
  quantity: z.number().default(1),
  unit: z.enum(['trip', 'meal', 'kg', 'kwh']),
  co2eKg: z.number(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.date(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type ActivitySubtype = z.infer<typeof ActivitySubtypeSchema>;

// Impact schemas
export const ImpactSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: z.string(), // e.g., "2025-W34" or "2025-08"
  co2eKg: z.number(),
  waterL: z.number(),
  wasteKg: z.number(),
  updatedAt: z.date(),
});

export type Impact = z.infer<typeof ImpactSchema>;

// Challenge schemas
export const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  durationDays: z.number(),
  rules: z.record(z.unknown()),
  rewards: z.object({
    points: z.number(),
    badge: z.string().optional(),
  }),
  isPublic: z.boolean().default(true),
  organizationId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

// Reward schemas
export const RewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  pointsCost: z.number(),
  stock: z.number(),
  partner: z.string(),
  region: z.string(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export type Reward = z.infer<typeof RewardSchema>;

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
