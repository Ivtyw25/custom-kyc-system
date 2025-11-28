import { GetFaceLivenessSessionResultsCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionLivenessClient } from "@/lib/aws/clients";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { livenessSessionId } = body;

        if (!livenessSessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const command = new GetFaceLivenessSessionResultsCommand({
            SessionId: livenessSessionId
        });

        const response = await rekognitionLivenessClient.send(command);
        const isLive = response.Confidence && response.Confidence > 75;

        return NextResponse.json({
            isLive,
            confidence: response.Confidence,
            status: response.Status,
        });

    } catch (error: unknown) {
        console.error("Error getting liveness results:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
