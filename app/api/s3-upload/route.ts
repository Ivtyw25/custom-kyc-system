import { s3Client } from "@/lib/aws/clients";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, NextRequest } from "next/server";

const bucketName = process.env.AWS_S3_BUCKET;

if (!bucketName) {
    throw new Error("Missing AWS configuration: AWS_S3_BUCKET");
}

export async function POST(req: NextRequest) {
    const { fileName, fileType } = await req.json();

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    return NextResponse.json({ uploadUrl });
}