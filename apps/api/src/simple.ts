import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import { app } from './app';

const PORT = process.env.PORT || 3000;

// Start server for local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Ecobeat API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth/*`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
