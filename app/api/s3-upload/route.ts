import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, NextRequest } from "next/server";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET;

if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing AWS configuration");
}


const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export async function POST(req: NextRequest) {
    const { fileName, fileType } = await req.json();

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    return NextResponse.json({ uploadUrl });
}