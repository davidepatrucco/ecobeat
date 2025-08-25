import AWS from 'aws-sdk';
import { EnvConfig, validateEnvConfig } from './config';

// AWS SSM client
const ssm = new AWS.SSM({ region: process.env.AWS_REGION || 'eu-west-1' });

/**
 * Get configuration from SSM Parameter Store (for Lambda environments)
 */
export async function getConfigFromSSM(): Promise<Partial<EnvConfig>> {
  const stage = process.env.NODE_ENV;
  
  // Only use SSM for staging and production environments
  if (!stage || stage === 'development' || stage === 'dev') {
    return {}; // Use .env file for development
  }

  try {
    console.log(`🔧 Loading SSM parameters for stage: ${stage}`);
    
    // Get all MongoDB parameters
    const mongoParams = await ssm.getParameters({
      Names: [
        `/ecobeat/${stage}/mongodb/uri`,
        `/ecobeat/${stage}/mongodb/username`, 
        `/ecobeat/${stage}/mongodb/password`,
      ],
      WithDecryption: true,
    }).promise();

    const params: Partial<EnvConfig> = {};
    
    mongoParams.Parameters?.forEach((param: AWS.SSM.Parameter) => {
      if (param.Name?.includes('/mongodb/uri')) {
        params.MONGODB_URI = param.Value!;
        console.log(`✅ Loaded MongoDB URI from SSM`);
      }
      // Username and password are available if needed separately
    });

    console.log(`✅ Loaded configuration from SSM for ${stage} environment`);
    return params;
    
  } catch (error) {
    console.error('❌ Error loading configuration from SSM:', error);
    throw error;
  }
}

/**
 * Get complete configuration merging environment variables and SSM parameters
 */
export async function getAppConfig(): Promise<EnvConfig> {
  try {
    // Start with environment variables
    const envVars = process.env;
    
    // If running on Lambda (staging/production), merge with SSM parameters  
    const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
    let ssmConfig = {};
    
    if (isLambda) {
      ssmConfig = await getConfigFromSSM();
    }
    
    // Merge configurations (SSM overrides env vars)
    const finalConfig = { ...envVars, ...ssmConfig };
    
    // Validate using the schema
    return validateEnvConfig(finalConfig);
  } catch (error) {
    console.error('❌ getAppConfig failed:', error);
    throw error;
  }
}
