#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcobeatStack } from './ecobeat-stack';
import { getEnvironmentConfig } from './environments/config';

const app = new cdk.App();

// Get environment from context (default to staging)
const stage = app.node.tryGetContext('environment') || app.node.tryGetContext('stage') || 'staging';
const envConfig = getEnvironmentConfig(stage);

new EcobeatStack(app, `EcobeatStack-${stage}`, {
  envConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || 'unknown',
    region: 'eu-west-1',
  },
  tags: {
    Environment: stage,
    Project: 'Ecobeat',
    ManagedBy: 'CDK',
  },
});
