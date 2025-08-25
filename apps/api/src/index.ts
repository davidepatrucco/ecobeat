import dotenv from 'dotenv';
import { app } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Ecobeat API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
