#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { TheFatLambdaStack } from '../lib/the-fat-lambda-stack';
import { TheSinglePurposeFunctionStack } from '../lib/the-single-purpose-stack';
import { TheLambdaLithStack } from '../lib/the-lambda-lith-stack';

const app = new cdk.App();
new TheFatLambdaStack(app, 'TheFatLambdaStack');
new TheSinglePurposeFunctionStack(app, 'TheSinglePurposeFunctionStack');
new TheLambdaLithStack(app, 'TheLambdaLithStack');