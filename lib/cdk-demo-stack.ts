import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_lambda_nodejs as lambda } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'CdkDemoBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const lambdaFunc = new lambda.NodejsFunction(this, 'CdkDemoLambda', {
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      runtime: Runtime.NODEJS_18_X,
    });

    new cdk.CfnOutput(this, 'CdkDemoBucketOutput', {
      value: bucket.bucketName,
      description: 'The name of an S3 bucket',
      exportName: 'CdkDemoBucketName',
    });


    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkDemoQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
