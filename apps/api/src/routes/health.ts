import { Router } from 'express';

export const healthRouter = Router();

// Health check endpoint
healthRouter.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecobeat-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check
healthRouter.get('/detailed', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecobeat-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
  });
});
