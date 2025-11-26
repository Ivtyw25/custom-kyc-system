import { GetFaceLivenessSessionResultsCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionClient } from "@/lib/aws-rekognition";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const command = new GetFaceLivenessSessionResultsCommand({
            SessionId: sessionId
        });

        const response = await rekognitionClient.send(command);
        const isLive = response.Confidence && response.Confidence > 90;

        return NextResponse.json({
            isLive,
            confidence: response.Confidence,
            status: response.Status,
            auditImages: response.AuditImages
        });

    } catch (error: any) {
        console.error("Error getting liveness results:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
