import mongoose from 'mongoose';
import AWS from 'aws-sdk';

/**
 * Test MongoDB connection
 */
export async function testMongoConnection(uri: string): Promise<{ status: string; latency?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Create a separate connection for testing to avoid conflicts
    const connection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
    });
    
    // Test with a simple ping
    if (connection.db) {
      await connection.db.admin().ping();
    }
    
    const latency = Date.now() - startTime;
    
    // Close the test connection
    await connection.close();
    
    return { status: 'connected', latency };
  } catch (error) {
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test AWS KMS access
 */
export async function testKMSAccess(keyId: string): Promise<{ status: string; keyArn?: string; error?: string }> {
  try {
    const kms = new AWS.KMS({ region: process.env.AWS_REGION || 'eu-west-1' });
    
    // Test by describing the key
    const result = await kms.describeKey({ KeyId: keyId }).promise();
    
    return { 
      status: 'accessible', 
      ...(result.KeyMetadata?.Arn && { keyArn: result.KeyMetadata.Arn })
    };
  } catch (error) {
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test Redis connection (dummy for now)
 */
export async function testRedisConnection(url: string): Promise<{ status: string; error?: string }> {
  // TODO: Implement real Redis connection test when Redis is added
  return { status: 'not_implemented' };
}

/**
 * Test SSM parameter access
 */
export async function testSSMAccess(stage: string): Promise<{ status: string; parameters?: string[]; error?: string }> {
  try {
    const ssm = new AWS.SSM({ region: process.env.AWS_REGION || 'eu-west-1' });
    
    // Test by getting MongoDB parameters
    const result = await ssm.getParameters({
      Names: [
        `/ecobeat/${stage}/mongodb/uri`,
        `/ecobeat/${stage}/mongodb/username`,
        `/ecobeat/${stage}/mongodb/password`,
      ],
      WithDecryption: false, // Don't decrypt for health check
    }).promise();
    
    const foundParams = result.Parameters?.map((p: AWS.SSM.Parameter) => p.Name || '') || [];
    
    return { 
      status: 'accessible', 
      parameters: foundParams 
    };
  } catch (error) {
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
