import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const photoBucketName = process.env.PHOTO_BUCKET_NAME!
const s3 = new S3()

function generateUrl(asset: S3.Object) {
	return s3.getSignedUrl('getObject', {
		Bucket: photoBucketName,
		Key: asset.Key,
		Expires: 24 * 60 * 60,
	})
}

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {

	console.log('event', photoBucketName)

	try {
		const results = await s3.listObjectsV2({
			Bucket: photoBucketName,
		}).promise();

		const allPhotos = await Promise.all(results.Contents?.map(async (asset) => {
			return {
				url: generateUrl(asset),
				key: asset.Key,
			}
		}
		) ?? [])

		return {
			body: JSON.stringify(allPhotos),
			statusCode: 200,
			isBase64Encoded: false,
			headers: {
				'Content-Type': 'application/json',
			},
		}
	} catch (err) {
		return {
			statusCode: 500,
			body: JSON.stringify(err)
		}
	}
}