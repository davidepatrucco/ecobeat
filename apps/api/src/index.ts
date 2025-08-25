import dotenv from 'dotenv';
import { createApp } from './app';
import { getAppConfig } from '@ecobeat/shared';

// Load environment variables for development
dotenv.config();

async function startServer() {
  try {
    // Load configuration (handles both .env and SSM)
    const config = await getAppConfig();
    console.log(`📋 Configuration loaded for ${config.NODE_ENV} environment`);
    
    // Create app with loaded configuration
    const app = createApp();
    
    const PORT = config.PORT || 3000;

    // Return app for Lambda use
    return { app, config, PORT };
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}

// Call startServer when this module is run directly
if (require.main === module) {
  startServer().then(({ app, config, PORT }) => {
    app.listen(PORT, () => {
      console.log(`🚀 Ecobeat API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${config.NODE_ENV}`);
    });
  }).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

// Export for Lambda
export default startServer;
