import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { sendResponse } from '../utils/response.js'

export async function add(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log(JSON.stringify(event, null, 2));

        const firstNum = event?.queryStringParameters?.firstNum ?? 0;
        const secondNum = event?.queryStringParameters?.secondNum ?? 0;
        
        const result = Number(firstNum) + Number(secondNum);
    
        return sendResponse(200, result);
    } catch (error: unknown) {
        console.error(error);
        throw error;
    }
}

export async function subtract(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const firstNum = event?.queryStringParameters?.firstNum ?? 0;
        const secondNum = event?.queryStringParameters?.secondNum ?? 0;
        
        const result = Number(firstNum) - Number(secondNum);
    
        return sendResponse(200, result);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function multiply(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const firstNum = event?.queryStringParameters?.firstNum ?? 0;
        const secondNum = event?.queryStringParameters?.secondNum ?? 0;
        
        const result = Number(firstNum) * Number(secondNum);
    
        return sendResponse(200, result);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
