import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { app } from './app';

// Create serverless handler
const serverlessHandler = serverlessExpress({ app });

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('📦 Lambda Event:', JSON.stringify(event, null, 2));
  
  try {
    const result = await serverlessHandler(event, context);
    console.log('✅ Lambda Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Lambda Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Lambda execution failed',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
