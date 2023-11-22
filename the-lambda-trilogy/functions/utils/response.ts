import type { APIGatewayProxyResult } from 'aws-lambda';

export function sendResponse(status: number, result: number): APIGatewayProxyResult {
    const response = {
        statusCode: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            result,
        }),
    };

    return response;
}
