"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisOptions = exports.mongoOptions = exports.envConfigSchema = void 0;
exports.validateEnvConfig = validateEnvConfig;
const zod_1 = require("zod");
// Environment configuration schema
exports.envConfigSchema = zod_1.z.object({
    // Server
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production', 'test']).default('development'),
    // Database
    MONGODB_URI: zod_1.z.string().url(),
    // Redis (optional for now in Lambda environment)
    REDIS_URL: zod_1.z.string().url().optional(),
    // JWT - will use AWS KMS in Lambda, local secret in dev
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    // AWS - will be provided as env vars in Lambda
    AWS_REGION: zod_1.z.string().default('eu-west-1'),
    AWS_KMS_KEY_ID: zod_1.z.string().optional(),
    // Email (optional for now)
    SES_FROM_EMAIL: zod_1.z.string().email().optional(),
    SES_REGION: zod_1.z.string().default('eu-west-1'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:8082'),
});
// Validate and parse environment variables
function validateEnvConfig(env) {
    const result = exports.envConfigSchema.safeParse(env);
    if (!result.success) {
        console.error('❌ Invalid environment configuration:');
        console.error(result.error.format());
        process.exit(1);
    }
    return result.data;
}
// Database connection options
exports.mongoOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};
// Redis connection options  
exports.redisOptions = {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
};
