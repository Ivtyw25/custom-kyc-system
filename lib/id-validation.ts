import { DetectLabelsCommand, DetectFacesCommand, DetectTextCommand, TextDetection } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "./aws-rekognition";

export async function validateIdLabel(buffer: Buffer) {
    const command = new DetectLabelsCommand({
        Image: { Bytes: buffer },
        MaxLabels: 5,
        MinConfidence: 95
    });
    const response = await rekognitionClient.send(command);
    const validLabels = ["ID Cards", "Passport", "Driving License", "Document", "Identity Document"];
    return response.Labels?.find(l => validLabels.includes(l.Name || ""));
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

export function calculateBoundingBox(textDetections: TextDetection[], padding = 0.05) {
    if (textDetections.length === 0) return null;

    let minLeft = 1.0;
    let minTop = 1.0;
    let maxRight = 0.0;
    let maxBottom = 0.0;

    textDetections.forEach(text => {
        const box = text.Geometry?.BoundingBox;
        if (box) {
            minLeft = Math.min(minLeft, box.Left || 0);
            minTop = Math.min(minTop, box.Top || 0);
            maxRight = Math.max(maxRight, (box.Left || 0) + (box.Width || 0));
            maxBottom = Math.max(maxBottom, (box.Top || 0) + (box.Height || 0));
        }
    });

    minLeft = Math.max(0, minLeft - padding);
    minTop = Math.max(0, minTop - padding);
    maxRight = Math.min(1, maxRight + padding);
    maxBottom = Math.min(1, maxBottom + padding);

    return {
        Left: minLeft,
        Top: minTop,
        Width: maxRight - minLeft,
        Height: maxBottom - minTop
    };
}
