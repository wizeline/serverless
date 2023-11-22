import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class TheSinglePurposeFunctionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        /**
         * Lambda functions
         */
        const defaultLambdaSettings: lambdaNodejs.NodejsFunctionProps = {
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            bundling: {
                preCompilation: true,
            },
            currentVersionOptions: {
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            },
        };

        const addLambda = new lambdaNodejs.NodejsFunction(this, 'AddLambda', {
            functionName: 'single-purpose-add-lambda',
            entry: './functions/single-purpose-function/add.ts',
            ...defaultLambdaSettings
        });
        
        new logs.LogGroup(this, 'AddLambdaLogGroup', {
            logGroupName: `/aws/lambda/${addLambda.functionName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const subtractLambda = new lambdaNodejs.NodejsFunction(this, 'SubtractLambda', {
            functionName: 'single-purpose-subtract-lambda',
            entry: './functions/single-purpose-function/subtract.ts',
            ...defaultLambdaSettings
        });

        new logs.LogGroup(this, 'SubtractLambdaLogGroup', {
            logGroupName: `/aws/lambda/${subtractLambda.functionName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        
        const multiplyLambda = new lambdaNodejs.NodejsFunction(this, 'MultiplyLambda', {
            functionName: 'single-purpose-multiply-lambda',
            entry: './functions/single-purpose-function/multiply.ts',
            ...defaultLambdaSettings
        });

        new logs.LogGroup(this, 'MultiplyLambdaLogGroup', {
            logGroupName: `/aws/lambda/${multiplyLambda.functionName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        /**
         * API gateway
         */
        const restApi = new apigw.RestApi(this, 'SinglePurposeLambdaAPI', {
            cloudWatchRole: true,
            deployOptions: {
                loggingLevel: apigw.MethodLoggingLevel.INFO,
                stageName: 'development',
                metricsEnabled: false,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: apigw.Cors.DEFAULT_HEADERS,
            },
            endpointTypes: [apigw.EndpointType.REGIONAL],
            cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        /**
         * Resources & Methods
         */
        const addResource = restApi.root.addResource('add');
        addResource.addMethod('GET', new apigw.LambdaIntegration(addLambda));
        
        const subtractResource = restApi.root.addResource('subtract');
        subtractResource.addMethod('GET', new apigw.LambdaIntegration(subtractLambda));
        
        const multiplyResource = restApi.root.addResource('multiply');
        multiplyResource.addMethod('GET', new apigw.LambdaIntegration(multiplyLambda));
    }
}
