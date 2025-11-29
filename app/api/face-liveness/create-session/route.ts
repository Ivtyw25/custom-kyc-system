import { CreateFaceLivenessSessionCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionLivenessClient } from "@/lib/aws/clients";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const bucketName = process.env.AWS_S3_BUCKET;
        if (!bucketName) {
            console.error("AWS_S3_BUCKET is not defined in environment variables");
            return NextResponse.json({ error: "Server configuration error: Missing S3 Bucket" }, { status: 500 });
        }

        const command = new CreateFaceLivenessSessionCommand({
            ClientRequestToken: sessionId,
            Settings: {
                OutputConfig: {
                    S3Bucket: bucketName,
                    S3KeyPrefix: `${sessionId}/`
                },
                AuditImagesLimit: 2
            }
        });
        const response = await rekognitionLivenessClient.send(command);
        return NextResponse.json({
            sessionId: response.SessionId
        });

    } catch (error: any) {
        console.error("Error creating liveness session:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            error: errorMessage,
            code: error.name,
            requestId: error.$metadata?.requestId
        }, { status: 500 });
    }
}
