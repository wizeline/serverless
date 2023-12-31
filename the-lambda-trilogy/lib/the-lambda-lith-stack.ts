import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class TheLambdaLithStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        /**
         * Lambda functions
         */
        const lambdaLith = new lambdaNodejs.NodejsFunction(this, 'LambdaLith', {
            functionName: 'the-lambda-lith',
            handler: 'handler',
            entry: './functions/lambda-lith/index.ts',
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            logRetention: logs.RetentionDays.TWO_WEEKS,
            bundling: {
                preCompilation: true,
            },
            currentVersionOptions: {
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            },
        });

        new logs.LogGroup(this, 'LambdaLithLogGroup', {
            logGroupName: `/aws/lambda/${lambdaLith.functionName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        /**
         * API gateway
         */
        const restApi = new apigw.RestApi(this, 'LambdaLithAPI', {
            cloudWatchRole: true,
            deployOptions: {
                loggingLevel: apigw.MethodLoggingLevel.INFO,
                stageName: 'development',
                metricsEnabled: false,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: [...apigw.Cors.DEFAULT_HEADERS],
            },
            endpointTypes: [apigw.EndpointType.REGIONAL],
            cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        /**
         * Resources & Methods
         */
        restApi.root.addProxy({
            defaultIntegration: new apigw.LambdaIntegration(lambdaLith)
        });
    }
}
