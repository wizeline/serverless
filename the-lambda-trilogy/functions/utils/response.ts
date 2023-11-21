import type { APIGatewayProxyResult } from 'aws-lambda';

export function sendResponse(status: number, body: string): APIGatewayProxyResult {
    const response = {
        statusCode: status,
        body: JSON.stringify(body),
    };

    return response;
}
