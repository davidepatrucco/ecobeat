"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFromSSM = getConfigFromSSM;
exports.getAppConfig = getAppConfig;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const config_1 = require("./config");
// AWS SSM client
const ssm = new aws_sdk_1.default.SSM({ region: process.env.AWS_REGION || 'eu-west-1' });
/**
 * Get configuration from SSM Parameter Store (for Lambda environments)
 */
async function getConfigFromSSM() {
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
                `/ecobeat/${stage}/jwt/secret`,
            ],
            WithDecryption: true,
        }).promise();
        const params = {};
        mongoParams.Parameters?.forEach((param) => {
            if (param.Name?.includes('/mongodb/uri')) {
                params.MONGODB_URI = param.Value;
                console.log(`✅ Loaded MongoDB URI from SSM`);
            }
            else if (param.Name?.includes('/jwt/secret')) {
                params.JWT_SECRET = param.Value;
                console.log(`✅ Loaded JWT Secret from SSM`);
            }
            // Username and password are available if needed separately
        });
        console.log(`✅ Loaded configuration from SSM for ${stage} environment`);
        return params;
    }
    catch (error) {
        console.error('❌ Error loading configuration from SSM:', error);
        throw error;
    }
}
/**
 * Get complete configuration merging environment variables and SSM parameters
 */
async function getAppConfig() {
    try {
        // Start with environment variables
        const envVars = process.env;
        // If running on Lambda (staging/production), merge with SSM parameters  
        const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
        let ssmConfig = {};
        if (isLambda) {
            ssmConfig = await getConfigFromSSM();
        }
        // Merge configurations with Lambda environment variables taking priority
        const finalConfig = {
            ...envVars,
            ...ssmConfig,
            // In Lambda, use KMS instead of JWT_SECRET
            ...(envVars.KMS_KEY_ID && { AWS_KMS_KEY_ID: envVars.KMS_KEY_ID })
        };
        // Validate using the schema
        return (0, config_1.validateEnvConfig)(finalConfig);
    }
    catch (error) {
        console.error('❌ getAppConfig failed:', error);
        throw error;
    }
}
