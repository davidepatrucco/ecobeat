import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { jwksRouter } from './routes/jwks';
import { emailRouter } from './routes/email';
import { biometricRouter } from './routes/biometric';
import { testRouter } from './routes/test';
// import { DatabaseService } from './services/database'; // Not used in this file

// Create Express app
export const createApp = () => {
  const app = express();

  // Middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // For serverless compatibility
    })
  );
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Database initialization will be done on-demand, not at startup
  // This prevents validation errors during module imports

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'ecobeat-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      stage: process.env.STAGE || 'dev',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        healthDetailed: '/health/detailed',
        auth: '/auth/*',
        email: '/email/*',
        biometric: '/biometric/*',
        jwks: '/.well-known/jwks.json',
        test: '/test/*',
      },
      isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
    });
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/email', emailRouter);
  app.use('/biometric', biometricRouter);
  app.use('/test', testRouter);
  app.use('/', jwksRouter); // JWKS endpoint at root level

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler
  app.use((error: any, req: Request, res: Response) => {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  });
  return app;
};

// Export app instance
export const app = createApp();
