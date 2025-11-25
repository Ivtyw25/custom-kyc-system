import { RekognitionClient, DetectLabelsCommand, DetectTextCommand, DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
    console.error("Missing AWS configuration");
}

const rekognition = new RekognitionClient({
    region: region,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || ""
    }
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image");
        const sessionId = formData.get("sessionId");

        if (!image || typeof image === "string") {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await image.arrayBuffer());

        // 1. Detect Labels to verify it's an ID
        const labelCommand = new DetectLabelsCommand({
            Image: { Bytes: buffer },
            MaxLabels: 5,
            MinConfidence: 95
        });

        const labelResponse = await rekognition.send(labelCommand);

        // console.log("--- Detected Labels ---");
        // labelResponse.Labels?.forEach(label => {
        //     console.log(`Label: ${label.Name}, Confidence: ${label.Confidence}`);
        // });

        const validLabels = ["ID Cards", "Passport", "Driving License", "Document", "Identity Document"];

        const idLabel = labelResponse.Labels?.find(l => validLabels.includes(l.Name || ""));

        if (!idLabel) {
            return NextResponse.json({ success: false, feedback: "Move your ID into view" });
        }

        // 2. Check Sharpness using DetectFaces (if a face is present on the ID)
        // Most IDs have a face. If found, we use it as a strong sharpness proxy.
        const detectFacesCommand = new DetectFacesCommand({
            Image: { Bytes: buffer },
            Attributes: ["DEFAULT"]
        });

        const faceResponse = await rekognition.send(detectFacesCommand);
        const face = faceResponse.FaceDetails?.[0];

        if (face) {
            const sharpness = face.Quality?.Sharpness || 0;
            const brightness = face.Quality?.Brightness || 0;

            console.log(`Face Quality - Sharpness: ${sharpness}, Brightness: ${brightness}`);

            if (sharpness < 40) {
                return NextResponse.json({ success: false, feedback: "Image is blurry"})
            }

            if (brightness < 40) {
                return NextResponse.json({ success: false, feedback: "Too dark" });
            }
            if (brightness > 95) {
                return NextResponse.json({ success: false, feedback: "Too bright." });
            }
        }

        // 3. Detect Text to verify it's clear (Secondary check, or primary if no face)
        const detectTextCommand = new DetectTextCommand({
            Image: { Bytes: buffer },
        });

        const textResponse = await rekognition.send(detectTextCommand);
        const textDetections = textResponse.TextDetections || [];

        // Filter for high confidence text to ensure clarity
        const clearText = textDetections.filter(t => (t.Confidence || 0) > 95);

        if (clearText.length < 5) {
            return NextResponse.json({ success: false, feedback: "Hold steady." });
        }

        const avgConfidence = clearText.reduce((acc, curr) => acc + (curr.Confidence || 0), 0) / clearText.length;

        if (avgConfidence < 96) {
            return NextResponse.json({ success: false, feedback: "Ensure good lighting and avoid glare." });
        }

        const detectedText = textDetections.map(t => t.DetectedText).join(" ");
        return NextResponse.json({ success: true, detectedText, feedback: "ID Detected!" });

    } catch (error: any) {
        console.error("Error detecting ID:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
