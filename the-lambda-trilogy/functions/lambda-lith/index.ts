import type { Request } from 'express';
import * as express from 'express';
import serverlessExpress from '@vendia/serverless-express';

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
    const total = firstNum + secondNum;

    response
        .status(200)
        .json({
            total,
        });
});

app.get('/subtract', async function (request, response) {
    logRequest(request, 'subtract');

    const firstNum = Number(request.query?.firstNum) || 0;
    const secondNum = Number(request.query?.secondNum) || 0;
    const total = firstNum - secondNum;

    response
        .status(200)
        .json({
            total,
        });
});

app.get('/multiply', async function (request, response) {
    logRequest(request, 'multiply');

    const firstNum = Number(request.query?.firstNum) || 0;
    const secondNum = Number(request.query?.secondNum) || 0;
    const result = firstNum * secondNum;

    response
        .status(200)
        .send(result.toString());
});

export const handler = serverlessExpress({ app });
