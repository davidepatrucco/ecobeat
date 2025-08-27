import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environments/config';

interface EcobeatStackProps extends cdk.StackProps {
  envConfig: EnvironmentConfig;
}

export class EcobeatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcobeatStackProps) {
    super(scope, id, props);

    const { envConfig } = props;
    const stage = envConfig.stage;

    // KMS Key for JWT signing
    const jwtKey = new kms.Key(this, 'JwtSigningKey', {
      description: 'KMS key for JWT token signing',
      keyUsage: kms.KeyUsage.SIGN_VERIFY,
      keySpec: kms.KeySpec.RSA_2048,
    });

    // Create alias for the key
    new kms.Alias(this, 'JwtSigningKeyAlias', {
      aliasName: `alias/ecobeat-jwt-signing-${stage}`,
      targetKey: jwtKey,
    });

    // SSM Parameters for MongoDB credentials
    const mongoUri = new ssm.StringParameter(this, 'MongoUri', {
      parameterName: `/ecobeat/${stage}/mongodb/uri`,
      stringValue: 'mongodb+srv://username:password@cluster.mongodb.net/ecobeat', // Will be updated manually
      description: 'MongoDB Atlas connection URI',
      tier: ssm.ParameterTier.STANDARD,
    });

    const mongoUsername = new ssm.StringParameter(this, 'MongoUsername', {
      parameterName: `/ecobeat/${stage}/mongodb/username`,
      stringValue: 'PLACEHOLDER_USERNAME', // Will be updated manually
      description: 'MongoDB Atlas username',
      tier: ssm.ParameterTier.STANDARD,
    });

    const mongoPassword = new ssm.StringParameter(this, 'MongoPassword', {
      parameterName: `/ecobeat/${stage}/mongodb/password`,
      stringValue: 'PLACEHOLDER_PASSWORD', // Will be updated manually
      description: 'MongoDB Atlas password',
      tier: ssm.ParameterTier.STANDARD,
    });

    // JWT Secret is managed manually, not by CDK

    // Get deploy tag from context to force Lambda updates
    const deployTag = String(this.node.tryGetContext('deployTag') ?? Date.now().toString());

    // Lambda function for API
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../apps/api/dist'),
      memorySize: envConfig.lambda.memorySize,
      timeout: cdk.Duration.seconds(envConfig.lambda.timeout),
      environment: {
        NODE_ENV: stage,
        KMS_KEY_ID: jwtKey.keyId,
        MONGODB_URI_PARAM: mongoUri.parameterName,
        MONGODB_USERNAME_PARAM: mongoUsername.parameterName,
        MONGODB_PASSWORD_PARAM: mongoPassword.parameterName,
        DEPLOY_TAG: deployTag, // This forces update when deployTag changes
        // AWS_REGION is automatically provided by Lambda runtime
      },
      tracing: envConfig.monitoring.enableXRay ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
    });

    // Grant KMS permissions to Lambda
    jwtKey.grant(apiFunction, 'kms:Sign', 'kms:GetPublicKey', 'kms:DescribeKey');

    // CloudWatch Log Group
    const retentionDays = envConfig.monitoring.logRetentionDays === 7 ? logs.RetentionDays.ONE_WEEK :
                         envConfig.monitoring.logRetentionDays === 14 ? logs.RetentionDays.TWO_WEEKS :
                         logs.RetentionDays.ONE_MONTH;
    
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: retentionDays,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'EcobeatApi', {
      restApiName: 'Ecobeat API',
      description: 'Ecobeat sustainable lifestyle tracking API',
      deployOptions: {
        stageName: stage, // Use the environment stage name
        description: `${stage} environment deployment`,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Lambda integration with proxy
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction, {
      proxy: true,
      allowTestInvoke: true,
    });
    
    // Add method for root path /
    api.root.addMethod('GET', lambdaIntegration);
    
    // Proxy all other requests to Lambda (handles all routes like /health, /auth/*)
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: apiFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function errors',
    });

    new cloudwatch.Alarm(this, 'ApiDurationAlarm', {
      metric: apiFunction.metricDuration(),
      threshold: cdk.Duration.seconds(10).toMilliseconds(),
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function duration',
    });

        // Grant permissions to access SSM parameters and KMS
    mongoPassword.grantRead(apiFunction);
    
    // Additional IAM permissions for broader SSM access (includes JWT secret)
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/ecobeat/${stage}/*`]
    }));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: jwtKey.keyId,
      description: 'KMS Key ID for JWT signing',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: jwtKey.keyArn,
      description: 'KMS Key ARN for JWT signing',
    });

    new cdk.CfnOutput(this, 'MongoUriParam', {
      value: mongoUri.parameterName,
      description: 'SSM Parameter name for MongoDB URI',
    });

    new cdk.CfnOutput(this, 'MongoUsernameParam', {
      value: mongoUsername.parameterName,
      description: 'SSM Parameter name for MongoDB username',
    });

    new cdk.CfnOutput(this, 'MongoPasswordParam', {
      value: mongoPassword.parameterName,
      description: 'SSM Parameter name for MongoDB password',
    });
  }
}
