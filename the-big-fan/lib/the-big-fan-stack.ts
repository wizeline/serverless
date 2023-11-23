import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';

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
        const apiResource = restApi.root.addResource('whitdrawl');
        
        const errorResponses = [
            {
                selectionPattern: '400',
                statusCode: '400',
                responseTemplates: {
                    'application/json': `{
                        "error": "Bad input!"
                    }`,
                },
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': '\'*\''
                },
            },
            {
                selectionPattern: '5\\d{2}',
                statusCode: '500',
                responseTemplates: {
                    'application/json': `{
                        "error": "Internal Service Error!"
                    }`,
                },
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Origin': '\'*\''
                },
            },
        ];
        const integration = new apigw.AwsIntegration({
            service: 'events',
            action: 'PutEvents',
            region: AWS_REGION,
            integrationHttpMethod: 'POST',
            options: {
                credentialsRole: restApiRole,
                passthroughBehavior: apigw.PassthroughBehavior.NEVER,
                requestTemplates: {
                    'application/json': `#set($context.requestOverride.header.X-Amz-Target = 'AWSEvents.PutEvents')
                    #set($context.requestOverride.header.Content-Type = 'application/x-amz-json-1.1')
                    #set($inputRoot = $input.path('$'))
                    {
                        "Entries": [
                            #foreach($transaction in $inputRoot.transactions)
                            {
                                "EventBusName": "BigFanBus",
                                "Source": "com.wizeline.serverless.bigfanapi",
                                "Detail": "{ \\"paymentType\\": \\"$transaction.paymentType\\", \\"amount\\": $transaction.amount }",
                                "Resources": [],
                                "DetailType": "transaction"
                            }#if($foreach.hasNext),#end
                            #end
                        ]
                    }`
                },
                integrationResponses: [
                    {
                        statusCode: '200',
                        responseTemplates: {
                            'application/json': `
                            {
                                "requestId": "$context.requestId"
                            }
                            `,
                        },
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Origin': '\'*\''
                        }
                    },
                    ...errorResponses,
                ]
            },
        });

        const methodOptions: apigw.MethodOptions = {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
                {
                    statusCode: '400',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
                {
                    statusCode: '500',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        };
        
        apiResource.addMethod('POST', integration, methodOptions);

        /**
         * Queues
         */
        const creditQueue = new sqs.Queue(this, 'BigFanCreditQueue', {
            visibilityTimeout: cdk.Duration.seconds(300),
            queueName: 'BigFanCreditQueue',
        });

        const debitQueue = new sqs.Queue(this, 'BigFanDebitQueue', {
            visibilityTimeout: cdk.Duration.seconds(300),
            queueName: 'BigFanDebitQueue',
        });

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

        const debitLambda = new lambdaNodejs.NodejsFunction(this, 'BigFanDebitLambda', {
            functionName: 'big-fan-debit-processor',
            entry: './functions/debit-processor.ts',
            ...defaultLambdaSettings,
        });

        debitQueue.grantConsumeMessages(debitLambda);
        debitLambda.addEventSource(new eventSources.SqsEventSource(debitQueue, {
            batchSize: 2,
            maxBatchingWindow: cdk.Duration.seconds(10),
            maxConcurrency: 2,
        }));

        const creditLambda = new lambdaNodejs.NodejsFunction(this, 'BigFanCreditLambda', {
            functionName: 'big-fan-credit-processor',
            entry: './functions/credit-processor.ts',
            ...defaultLambdaSettings,
        });

        creditQueue.grantConsumeMessages(creditLambda);
        creditLambda.addEventSource(new eventSources.SqsEventSource(creditQueue, {
            batchSize: 2,
            maxBatchingWindow: cdk.Duration.seconds(10),
            maxConcurrency: 2,
        }));

        /**
         * LogGroup
         */
        const logGroup = new logs.LogGroup(this, 'BigFanEventLogGroup', {
            logGroupName: `/aws/events/${eventBus.eventBusName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        /**
         * Event Rules & Targets
         */
        const eventLoggerRule = new events.Rule(this, 'BigFanEventLoggerRule', {
            description: 'Log all events',
            eventBus,
            eventPattern: {
                region: [AWS_REGION],
            },
        });
        
        eventLoggerRule.addTarget(new eventsTargets.CloudWatchLogGroup(logGroup));

        const creditRule = new events.Rule(this, 'BigFanCreditRule', {
            description: 'Send credit card events',
            eventBus,
            eventPattern: {
                detail: {
                    paymentType: ['credit'],
                },
                detailType: ['transaction'],
            },
        });
        creditRule.addTarget(new eventsTargets.SqsQueue(creditQueue));

        const debitRule = new events.Rule(this, 'BigFanDebitRule', {
            description: 'Send debit card events',
            eventBus,
            eventPattern: {
                detail: {
                    paymentType: ['debit'],
                },
                detailType: ['transaction'],
            },
        });
        debitRule.addTarget(new eventsTargets.SqsQueue(debitQueue));
    }
}
    