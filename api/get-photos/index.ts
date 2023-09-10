import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
	  return {
    body: JSON.stringify({ message: 'Hello from Lambda!' }),
    statusCode: 200,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
    },
  }
}