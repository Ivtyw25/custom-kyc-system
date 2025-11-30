import { CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionLivenessClient } from "@/lib/aws/clients";

const bucketName = process.env.AWS_S3_BUCKET;

if (!bucketName) {
    console.error("Missing configuration:", {
        hasBucketName: !!bucketName,
        bucketName
    });
    throw new Error("Missing AWS configuration");
}

export async function POST(req: NextRequest) {
    try {
        const { idFrontKey, selfieKey } = await req.json();
        if (!bucketName || !idFrontKey || !selfieKey) {
            console.error("Missing required parameters:", {
                hasBucketName: !!bucketName,
                hasIdFrontKey: !!idFrontKey,
                hasSelfieKey: !!selfieKey,
                bucketName,
            });
            return NextResponse.json({
                success: false,
                error: "Missing required AWS parameters"
            }, { status: 400 });
        }

        const rekognitionParams = {
            SourceImage: { S3Object: { Bucket: bucketName, Name: idFrontKey } }, // ID Card
            TargetImage: { S3Object: { Bucket: bucketName, Name: selfieKey } },  // Selfie
            SimilarityThreshold: 80,
        };

        const command = new CompareFacesCommand(rekognitionParams);
        const response = await rekognitionLivenessClient.send(command);

        const match = response.FaceMatches && response.FaceMatches.length > 0;
        const confidence = match ? response.FaceMatches?.[0]?.Similarity ?? 0 : 0;
        const isVerified = confidence > 80;

        return NextResponse.json({ success: isVerified, confidence });

    } catch (error: unknown) {  
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error Type:", err.constructor.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);

        return NextResponse.json({
            success: false,
            error: err.message,
            errorType: err.constructor.name
        }, { status: 500 });
    }
}