import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apig from 'aws-cdk-lib/aws-apigateway';

export class TheFatLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        /**
         * Lambda functions
         */
        const defaultLambdaSettings = {
            entry: './functions/fat-lambda/index.ts',
            runtime: lambda.Runtime.NODEJS_18_X,
            architecture: lambda.Architecture.ARM_64,
            logRetention: logs.RetentionDays.TWO_WEEKS,
            bundling: {
                preCompilation: true,
            },
        };

        const addLambda = new lambdaNodejs.NodejsFunction(this, 'AddLambda', {
            functionName: 'fat-add-lambda',
            handler: 'add',
            ...defaultLambdaSettings
        });

        const subtractLambda = new lambdaNodejs.NodejsFunction(this, 'SubtractLambda', {
            functionName: 'fat-subtract-lambda',
            handler: 'subtract',
            ...defaultLambdaSettings
        });
        
        const multiplyLambda = new lambdaNodejs.NodejsFunction(this, 'MultiplyLambda', {
            functionName: 'fat-multiply-lambda',
            handler: 'multiply',
            ...defaultLambdaSettings
        });

        /**
         * API gateway
         */
        const restApi = new apig.RestApi(this, 'FatLambdaAPI', {
            cloudWatchRole: true,
            deployOptions: {
                loggingLevel: apig.MethodLoggingLevel.INFO,
                stageName: 'development',
                metricsEnabled: false,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apig.Cors.ALL_ORIGINS,
                allowMethods: apig.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type'],
                statusCode: 200,
            },
            endpointTypes: [apig.EndpointType.REGIONAL],
        });

        /**
         * Resources & Methods
         */
        const addResource = restApi.root.addResource('add');
        addResource.addMethod('GET', new apig.LambdaIntegration(addLambda));
        
        const subtractResource = restApi.root.addResource('subtract');
        subtractResource.addMethod('GET', new apig.LambdaIntegration(subtractLambda));
        
        const multiplyResource = restApi.root.addResource('multiply');
        multiplyResource.addMethod('GET', new apig.LambdaIntegration(multiplyLambda));
    }
}
