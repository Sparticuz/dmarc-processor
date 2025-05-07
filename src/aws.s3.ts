import {
  GetObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export const getFileFromS3 = async (
  Bucket: string,
  Key: string,
): Promise<GetObjectCommandOutput> =>
  s3.send(
    new GetObjectCommand({
      Bucket,
      Key,
    }),
  );

export const getStringFromS3 = async (
  Bucket: string,
  Key: string,
): Promise<string> => {
  const file = await getFileFromS3(Bucket, Key);
  if (!file.Body) {
    throw new Error("No Body");
  }
  return file.Body.transformToString();
};
