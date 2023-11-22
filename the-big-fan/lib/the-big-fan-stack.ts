import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TheBigFanStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const AWS_REGION = this.region;
        
        /**
         * Event Bus
         */
        const eventBus = new events.EventBus(this, 'EventBus', {
            eventBusName: 'BigFanBus',
        });

        const eventLoggerRule = new events.Rule(this, 'EventLoggerRule', {
            description: 'Log all events',
            eventBus,
            eventPattern: {
                region: [AWS_REGION],
            },
        });

        const logGroup = new logs.LogGroup(this, 'EventLogGroup', {
            logGroupName: `/aws/events/${eventBus.eventBusName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const logGroupTarget = new eventsTargets.CloudWatchLogGroup(logGroup);

        eventLoggerRule.addTarget(logGroupTarget);

        /**
         * API
         */
        const restApi = new apigw.RestApi(this, 'BigFanAPI', {
            cloudWatchRole: true,
            cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
            deployOptions: {
                loggingLevel: apigw.MethodLoggingLevel.INFO,
                stageName: 'development',
                metricsEnabled: true,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: apigw.Cors.DEFAULT_HEADERS,
            },
            endpointTypes: [apigw.EndpointType.REGIONAL],
        });

        const restApiRole = new iam.Role(this, 'BigFanApiRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com', {
                region: AWS_REGION,
            }),
        });

        restApiRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [eventBus.eventBusArn],
                actions: ['events:PutEvents'],
            })
        );

        /**
         * Resources & Methods
         */
        const orderResource = restApi.root.addResource('order');
        
        const integration = new apigw.AwsIntegration({
            service: 'events',
            action: 'PutEvents',
            region: AWS_REGION,
            integrationHttpMethod: 'POST',
            options: {
                credentialsRole: restApiRole,
            },
        });

        orderResource.addMethod('POST', integration);
    }
}
