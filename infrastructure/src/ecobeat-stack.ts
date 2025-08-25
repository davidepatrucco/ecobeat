import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class EcobeatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for JWT signing
    const jwtKey = new kms.Key(this, 'JwtSigningKey', {
      description: 'KMS key for JWT token signing',
      keyUsage: kms.KeyUsage.SIGN_VERIFY,
      keySpec: kms.KeySpec.RSA_2048,
    });

    // Create alias for the key
    new kms.Alias(this, 'JwtSigningKeyAlias', {
      aliasName: 'alias/ecobeat-jwt-signing',
      targetKey: jwtKey,
    });

    // Lambda function for API
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Ecobeat API - Coming Soon',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
      environment: {
        KMS_KEY_ID: jwtKey.keyId,
      },
    });

    // Grant KMS permissions to Lambda
    jwtKey.grant(apiFunction, 'kms:Sign', 'kms:GetPublicKey');

    // CloudWatch Log Group
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'EcobeatApi', {
      restApiName: 'Ecobeat API',
      description: 'Ecobeat sustainable lifestyle tracking API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction);
    
    // Health endpoint
    const health = api.root.addResource('health');
    health.addMethod('GET', lambdaIntegration);

    // Auth endpoints (placeholder)
    const auth = api.root.addResource('auth');
    auth.addMethod('POST', lambdaIntegration);

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
  }
}
