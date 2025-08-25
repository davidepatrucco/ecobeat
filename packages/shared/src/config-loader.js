"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFromSSM = getConfigFromSSM;
exports.getAppConfig = getAppConfig;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
// AWS SSM client
const ssm = new aws_sdk_1.default.SSM({ region: process.env.AWS_REGION || 'eu-west-1' });
/**
 * Get configuration from SSM Parameter Store (for Lambda environments)
 */
async function getConfigFromSSM() {
    const stage = process.env.NODE_ENV;
    if (!stage || stage === 'development') {
        return {}; // Use .env file for development
    }
    try {
        // Get all MongoDB parameters
        const mongoParams = await ssm.getParameters({
            Names: [
                `/ecobeat/${stage}/mongodb/uri`,
                `/ecobeat/${stage}/mongodb/username`,
                `/ecobeat/${stage}/mongodb/password`,
            ],
            WithDecryption: true,
        }).promise();
        const params = {};
        mongoParams.Parameters?.forEach((param) => {
            if (param.Name?.includes('/mongodb/uri')) {
                params.MONGODB_URI = param.Value;
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
    const { validateEnvConfig } = await Promise.resolve().then(() => __importStar(require('./config')));
    return validateEnvConfig(finalConfig);
}
