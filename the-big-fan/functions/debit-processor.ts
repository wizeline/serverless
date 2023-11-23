import type { SQSEvent } from 'aws-lambda';

export async function handler(event: SQSEvent): Promise<void> {
    console.log(JSON.stringify({
        msg: 'Debit Card Processor',
        event,
    }, null, 2));
    
    try {
        const records = event.Records;

        for (const record of records) {
            const payload = record.body;

            console.log(`received message: ${payload}`)
        }

    } catch (error) {
        console.error(error);
        throw error;
    }
}
