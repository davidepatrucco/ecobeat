import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';

// Create Express app
export const createApp = () => {
  const app = express();

  // Middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // For serverless compatibility
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: err.status >= 400 && err.status < 500 ? 'Client Error' : 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

// Export app instance
export const app = createApp();
