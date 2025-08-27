import { z } from 'zod';

// Environment configuration schema
export const envConfigSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // Database
  MONGODB_URI: z.string().url(),
  
  // Redis (optional for now in Lambda environment)
  REDIS_URL: z.string().url().optional(),
  
  // JWT - will use AWS KMS in Lambda, local secret in dev
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // AWS - will be provided as env vars in Lambda
  AWS_REGION: z.string().default('eu-west-1'),
  AWS_KMS_KEY_ID: z.string().optional(),
  
  // Email (optional for now)
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_REGION: z.string().default('eu-west-1'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8082'),
});

export type EnvConfig = z.infer<typeof envConfigSchema>;

// Validate and parse environment variables
export function validateEnvConfig(env: Record<string, string | undefined>): EnvConfig {
  const result = envConfigSchema.safeParse(env);
  
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}

// Database connection options
export const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
} as const;

// Redis connection options  
export const redisOptions = {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
} as const;
