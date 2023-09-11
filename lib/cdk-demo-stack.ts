import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_lambda_nodejs as lambda } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
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

    const bucketPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [ 's3:ListBucket', 's3:GetObject', 's3:PutObject' ],
      // Important to have both the bucket ARN and the bucket ARN with /* at the end
      resources: [ `${bucket.bucketArn}`, `${bucket.bucketArn}/*` ],
    });

    new BucketDeployment(this, 'CdkDemoBucketDeployment', {
      sources: [ Source.asset(path.join(__dirname, '..', 'assets')) ],
      destinationBucket: bucket,
    });


    const lambdaFunc = new lambda.NodejsFunction(this, 'CdkDemoLambda', {
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'handler',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName,
      },
      runtime: Runtime.NODEJS_18_X,
    });

    lambdaFunc.addToRolePolicy(bucketPolicy);

    new cdk.CfnOutput(this, 'CdkDemoBucketOutput', {
      value: bucket.bucketName,
      description: 'The name of an S3 bucket',
      exportName: 'CdkDemoBucketName',
    });
  }
}
