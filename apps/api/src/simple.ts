import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecobeat-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth placeholder endpoints
app.post('/auth/register', (req: express.Request, res: express.Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Auth endpoints will be implemented in Phase 2',
    timestamp: new Date().toISOString(),
  });
});

app.post('/auth/login', (req: express.Request, res: express.Response) => {
  res.status(501).json({
    error: 'Not Implemented', 
    message: 'Auth endpoints will be implemented in Phase 2',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
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

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Ecobeat API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
