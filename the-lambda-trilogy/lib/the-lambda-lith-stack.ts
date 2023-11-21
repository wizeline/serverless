import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apig from 'aws-cdk-lib/aws-apigateway';

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
        });

        /**
         * API gateway
         */
        const restApi = new apig.RestApi(this, 'LambdaLithAPI', {
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
        restApi.root.addProxy({
            defaultIntegration: new apig.LambdaIntegration(lambdaLith)
        });
    }
}
