import 'source-map-support/register';
import type { Request } from 'express';
import * as express from 'express';
import { configure as serverlessExpress } from '@vendia/serverless-express';

const app = express();

function logRequest(request: Request, handler: string) {
    console.log(JSON.stringify({
        handler,
        query: request?.query,
        method: request?.method,
        path: request?.path,
    }, null, 2));
}

app.get('/add', async function (request, response) {
    logRequest(request, 'add');

    const firstNum = Number(request.query?.firstNum) || 0;
    const secondNum = Number(request.query?.secondNum) || 0;
    const result = firstNum + secondNum;

    return response
        .status(200)
        .set('Access-Control-Allow-Origin', '*')
        .json({
            result,
        });
});

app.get('/subtract', async function (request, response) {
    logRequest(request, 'subtract');

    const firstNum = Number(request.query?.firstNum) || 0;
    const secondNum = Number(request.query?.secondNum) || 0;
    const total = firstNum - secondNum;

    return response
        .status(200)
        .set('Access-Control-Allow-Origin', '*')
        .json({
            total,
        });
});

app.get('/multiply', async function (request, response) {
    logRequest(request, 'multiply');

    const firstNum = Number(request.query?.firstNum) || 0;
    const secondNum = Number(request.query?.secondNum) || 0;
    const result = firstNum * secondNum;

    return response
        .status(200)
        .set('Access-Control-Allow-Origin', '*')
        .send(result.toString());
});

export const handler = serverlessExpress({ app });
