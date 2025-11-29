import { DetectFacesCommand, DetectTextCommand, TextDetection, DetectCustomLabelsCommand } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "./aws/clients";

export async function validateIdLabel(buffer: Buffer, side: "front" | "back") {
    const command = new DetectCustomLabelsCommand({
        Image: { Bytes: buffer },
        MinConfidence: 80,
        ProjectVersionArn: process.env.NEXT_PUBLIC_AWS_MYKAD_MODEL
    });
    const response = await rekognitionClient.send(command);

    console.log("Detected Custom Labels:", response.CustomLabels?.map(l => ({ Name: l.Name, Confidence: l.Confidence })));
    const targetLabel = side === "front" ? "IC-Front" : "IC-Back";
    return response.CustomLabels?.find(l => l.Name === targetLabel && (l.Confidence || 0) > 80);
}

export async function checkFaceQuality(buffer: Buffer) {
    const command = new DetectFacesCommand({
        Image: { Bytes: buffer },
        Attributes: ["DEFAULT"]
    });
    const response = await rekognitionClient.send(command);
    return response.FaceDetails?.[0];
}

export async function checkTextClarity(buffer: Buffer) {
    const command = new DetectTextCommand({
        Image: { Bytes: buffer },
    });
    const response = await rekognitionClient.send(command);
    return response.TextDetections || [];
}

