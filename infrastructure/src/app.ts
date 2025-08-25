#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcobeatStack } from './ecobeat-stack';

const app = new cdk.App();

new EcobeatStack(app, 'EcobeatStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-west-1',
  },
});
