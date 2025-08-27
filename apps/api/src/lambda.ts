import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getAppConfig } from '@ecobeat/shared';
import { createApp } from './app';
import serverlessExpress from '@vendia/serverless-express';

// Debug handlers for unhandled promises (per suggestion dell'esperto)
process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));
process.on('uncaughtException', (e) => console.error('uncaughtException', e));

let serverlessExpressInstance: any;
let appInitialized = false;

/**
 * Initialize app with configuration (called once per container)
 */
async function initializeApp() {
  if (!appInitialized) {
    try {
      // Load configuration from SSM
      const config = await getAppConfig();
      console.log(`📋 Lambda configuration loaded for ${config.NODE_ENV} environment`);
      
      // Create app with loaded configuration
      const app = createApp();
      
      // Create serverless express instance
      serverlessExpressInstance = serverlessExpress({ app });
      appInitialized = true;
      
      console.log('✅ Lambda app initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      throw error;
    }
  }
  return serverlessExpressInstance;
}

/**
 * AWS Lambda handler for API Gateway proxy events
 * Seguendo il pattern dell'esperto: async/await + return sempre
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('📨 Lambda request:', {
    method: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    resource: event.resource,
    stage: event.requestContext?.stage,
    fullEvent: JSON.stringify(event, null, 2)
  });
  
  // Prevent Lambda from waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Initialize app if not already done - SEMPRE await
    const serverlessApp = await initializeApp();
    
    // Use serverless-express to handle the request - SEMPRE await e return
    const result = await serverlessApp(event, context);
    
    console.log('✅ Lambda response:', { 
      statusCode: result.statusCode,
      bodyLength: result.body?.length || 0 
    });
    
    return result; // <-- SEMPRE return!
    
  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    
    // SEMPRE return anche in caso di errore
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
