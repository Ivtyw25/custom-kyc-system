import { CreateFaceLivenessSessionCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionClient } from "@/lib/aws-rekognition";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const command = new CreateFaceLivenessSessionCommand({
            ClientRequestToken: sessionId,
            Settings: {
                OutputConfig: {
                    S3Bucket: process.env.AWS_S3_BUCKET_NAME || "",
                    S3KeyPrefix: `${sessionId}/selfie.jpg`
                },
                AuditImagesLimit: 1
            }
        });

        const response = await rekognitionClient.send(command);

        return NextResponse.json({
            sessionId: response.SessionId
        });

    } catch (error: any) {
        console.error("Error creating liveness session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
