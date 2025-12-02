import { NextRequest, NextResponse } from "next/server";
import { InferenceHTTPClient } from "@roboflow/inference-sdk";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { offer } = body;
        const wrtcParams = body.wrtcParams;
        const apiKey = process.env.ROBOFLOW_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
        }

        const client = InferenceHTTPClient.init({ apiKey });
        const answer = await client.initializeWebrtcWorker({
            offer,
            workspaceName: wrtcParams.workspaceName,
            workflowId: wrtcParams.workflowId,
            config: {
                imageInputName: wrtcParams.imageInputName,
                streamOutputNames: wrtcParams.streamOutputNames,
                dataOutputNames: wrtcParams.dataOutputNames,
            },
        });

        return NextResponse.json(answer);
    } catch (error: any) {
        console.error("Roboflow Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Failed to initialize WebRTC" }, { status: 500 });
    }
}
