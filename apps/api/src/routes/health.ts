import { Router } from 'express';
import { getAppConfig } from '@ecobeat/shared';
import {
  testMongoConnection,
  testKMSAccess,
  testRedisConnection,
  testSSMAccess,
} from '../services/health-checks';
// import { DatabaseService } from '../services/database'; // Used inline in detailed health check

export const healthRouter = Router();

// Basic health check endpoint
healthRouter.get('/', async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ecobeat-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'ecobeat-api',
      error: 'Health check failed',
    });
  }
});

// Detailed health check with services verification
healthRouter.get('/detailed', async (req, res) => {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecobeat-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    checks: {
      config: 'unknown',
      mongodb: 'unknown',
      kms: 'unknown',
      ssm: 'unknown',
      redis: 'unknown',
    },
  };

  let allHealthy = true;

  try {
    // 1. Configuration check
    try {
      const config = await getAppConfig();
      healthStatus.checks.config = 'ok';
      healthStatus.mongoUri = config.MONGODB_URI ? 'configured' : 'missing';
    } catch (error) {
      healthStatus.checks.config = 'error';
      allHealthy = false;
    }

    // 2. MongoDB connection check (real connection test)
    try {
      const config = await getAppConfig();
      if (config.MONGODB_URI) {
        const mongoTest = await testMongoConnection(config.MONGODB_URI);
        healthStatus.checks.mongodb = mongoTest.status;
        healthStatus.mongoLatency = mongoTest.latency;
        healthStatus.mongoError = mongoTest.error;

        if (mongoTest.status === 'error') {
          allHealthy = false;
        }
      } else {
        healthStatus.checks.mongodb = 'not_configured';
        allHealthy = false;
      }
    } catch (error) {
      healthStatus.checks.mongodb = 'error';
      healthStatus.mongoError =
        error instanceof Error ? error.message : 'Unknown error';
      allHealthy = false;
    }

    // 3. KMS access check (real access test)
    try {
      const kmsKeyId = process.env.KMS_KEY_ID;
      if (kmsKeyId) {
        const kmsTest = await testKMSAccess(kmsKeyId);
        healthStatus.checks.kms = kmsTest.status;
        healthStatus.kmsKeyArn = kmsTest.keyArn;
        healthStatus.kmsError = kmsTest.error;

        if (kmsTest.status === 'error') {
          allHealthy = false;
        }
      } else {
        healthStatus.checks.kms = 'not_configured';
        allHealthy = false;
      }
    } catch (error) {
      healthStatus.checks.kms = 'error';
      healthStatus.kmsError =
        error instanceof Error ? error.message : 'Unknown error';
      allHealthy = false;
    }

    // 4. SSM parameters check (real access test)
    try {
      const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
      const environment = process.env.NODE_ENV;

      if (isLambda && environment && environment !== 'development') {
        const ssmTest = await testSSMAccess(environment);
        healthStatus.checks.ssm = ssmTest.status;
        healthStatus.ssmParameters = ssmTest.parameters;
        healthStatus.ssmError = ssmTest.error;

        if (ssmTest.status === 'error') {
          allHealthy = false;
        }
      } else {
        healthStatus.checks.ssm = `local_environment_${environment}`;
      }

      healthStatus.isLambda = !!isLambda;
      healthStatus.lambdaFunction = isLambda || 'none';
    } catch (error) {
      healthStatus.checks.ssm = 'error';
      healthStatus.ssmError =
        error instanceof Error ? error.message : 'Unknown error';
      allHealthy = false;
    }

    // 5. Redis connection check (dummy for now)
    try {
      const config = await getAppConfig();
      if (config.REDIS_URL) {
        const redisTest = await testRedisConnection(config.REDIS_URL);
        healthStatus.checks.redis = redisTest.status;
        healthStatus.redisError = redisTest.error;
      } else {
        healthStatus.checks.redis = 'not_configured';
      }
    } catch (error) {
      healthStatus.checks.redis = 'error';
      allHealthy = false;
    }

    healthStatus.status = allHealthy ? 'ok' : 'degraded';
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'ecobeat-api',
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
