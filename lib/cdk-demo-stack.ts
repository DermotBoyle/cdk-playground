import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_lambda_nodejs as lambda, aws_cloudfront as cloudFront } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as apiGatewayV2 from '@aws-cdk/aws-apigatewayv2-alpha'
import * as apiGatewayV2Integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as path from 'path';
import { BlockPublicAccess, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';

interface CdkDemoStackProps extends cdk.StackProps {
  envName: string;
}

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CdkDemoStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'CdkDemoBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    const websiteBucket = new s3.Bucket(this, 'CdkDemoWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL
    });

    const oia = new OriginAccessIdentity(this, 'CdkDemoOriginAccessIdentity', {
      comment: 'Allows CloudFront to reach the website bucket',
    });

    websiteBucket.grantRead(oia);

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

    const cloudFrontDist = new cloudFront.CloudFrontWebDistribution(this, 'CdkDemoCloudFrontDist', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
            originAccessIdentity: oia,
          },
          behaviors: [ { isDefaultBehavior: true } ],
        },
      ],
    });

    new BucketDeployment(this, 'CdkDemoWebsiteBucketDeployment', {
      sources: [ Source.asset(path.join(__dirname, '..', 'demo-app', 'build')) ],
      destinationBucket: websiteBucket,
      distribution: cloudFrontDist, // on deploy this will invalidate the CloudFront cache
    });


    const lambdaFunc = new lambda.NodejsFunction(this, 'CdkDemoLambda', {
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'handler',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName,
      },
      runtime: Runtime.NODEJS_18_X,
    });

    const lambdaIntegration = new apiGatewayV2Integrations.HttpLambdaIntegration(
      'CdkDemoLambdaIntegration',
      lambdaFunc,
    );

    lambdaFunc.addToRolePolicy(bucketPolicy);

    const httpApi = new apiGatewayV2.HttpApi(this, 'CdkDemoHttpApi', {
      corsPreflight: {
        allowOrigins: [ '*' ],
        allowMethods: [ apiGatewayV2.CorsHttpMethod.GET ],
        maxAge: cdk.Duration.days(10),
      },
    });

    httpApi.addRoutes({
      path: '/getAllPhotos',
      methods: [ apiGatewayV2.HttpMethod.GET ],
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'CdkDemoBucketOutput', {
      value: bucket.bucketName,
      description: 'The name of an S3 bucket',
      exportName: `CdkDemoBucketName${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'CdkDemoHttpApiOutput', {
      value: httpApi.url!,
      description: 'Demo HTTP API Endpoint',
      exportName: `CdkDemoHttpApiEndpoint${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'CdkDemoWebsiteBucketOutput', {
      value: websiteBucket.bucketName,
      description: 'The name of the website bucket',
      exportName: `CdkDemoWebsiteBucketName${props?.envName}`,
    });

    new cdk.CfnOutput(this, 'CdkDemoCloudFrontDistOutput', {
      value: cloudFrontDist.distributionDomainName,
      description: 'The domain name of the CloudFront distribution',
      exportName: `CdkDemoCloudFrontDistDomainName${props?.envName}`,
    });

  }
}
