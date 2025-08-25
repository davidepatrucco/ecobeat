"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseSchema = exports.RewardSchema = exports.ChallengeSchema = exports.ImpactSchema = exports.ActivitySchema = exports.ActivitySubtypeSchema = exports.ActivityTypeSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    locale: zod_1.z.string().default('it-IT'),
    level: zod_1.z.string().default('Eco Starter'),
    points: zod_1.z.number().default(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Activity schemas
exports.ActivityTypeSchema = zod_1.z.enum(['commute', 'meal', 'recycle', 'energy']);
exports.ActivitySubtypeSchema = zod_1.z.enum(['bike', 'car', 'bus', 'walk', 'veg', 'meat', 'plastic', 'paper', 'kwh']);
exports.ActivitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    type: exports.ActivityTypeSchema,
    subtype: exports.ActivitySubtypeSchema,
    quantity: zod_1.z.number().default(1),
    unit: zod_1.z.enum(['trip', 'meal', 'kg', 'kwh']),
    co2eKg: zod_1.z.number(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    timestamp: zod_1.z.date(),
});
// Impact schemas
exports.ImpactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    period: zod_1.z.string(), // e.g., "2025-W34" or "2025-08"
    co2eKg: zod_1.z.number(),
    waterL: zod_1.z.number(),
    wasteKg: zod_1.z.number(),
    updatedAt: zod_1.z.date(),
});
// Challenge schemas
exports.ChallengeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    slug: zod_1.z.string(),
    description: zod_1.z.string(),
    durationDays: zod_1.z.number(),
    rules: zod_1.z.record(zod_1.z.unknown()),
    rewards: zod_1.z.object({
        points: zod_1.z.number(),
        badge: zod_1.z.string().optional(),
    }),
    isPublic: zod_1.z.boolean().default(true),
    organizationId: zod_1.z.string().optional(),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
});
// Reward schemas
exports.RewardSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    pointsCost: zod_1.z.number(),
    stock: zod_1.z.number(),
    partner: zod_1.z.string(),
    region: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    isActive: zod_1.z.boolean().default(true),
});
// API Response schemas
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
