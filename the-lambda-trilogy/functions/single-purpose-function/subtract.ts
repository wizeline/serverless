import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { sendResponse } from '../utils/response.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log(JSON.stringify(event, null, 2));

        const firstNum = event?.queryStringParameters?.firstNum ?? 0;
        const secondNum = event?.queryStringParameters?.secondNum ?? 0;
        
        const result = Number(firstNum) - Number(secondNum);
    
        return sendResponse(200, result.toString());
    } catch (error) {
        console.error(error);
        return sendResponse(500, 'Internal error');
    }
}
