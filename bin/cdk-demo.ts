#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkDemoStack } from '../lib/cdk-demo-stack';

const app = new cdk.App();
new CdkDemoStack(app, 'CdkDemoDevStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION
  },
  envName: 'dev'
});

new CdkDemoStack(app, 'CdkDemoProdStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION
  },
  envName: 'prod'
});
