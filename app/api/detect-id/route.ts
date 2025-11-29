import { NextRequest, NextResponse } from "next/server";
import {
    validateIdLabel,
    checkFaceQuality,
    checkTextClarity,
} from "@/lib/id-validation";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image");
        const side = formData.get("side") as string || "front";

        if (!image || typeof image === "string") {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const idLabel = await validateIdLabel(buffer, side as "front" | "back");

        if (!idLabel) {
            return NextResponse.json({ success: false, feedback: `Move your ${side} ID into view` });
        }

        if (side !== "back") {
            const face = await checkFaceQuality(buffer);

            if (face) {
                const sharpness = face.Quality?.Sharpness || 0;
                const brightness = face.Quality?.Brightness || 0;

                console.log(`Face Quality - Sharpness: ${sharpness}, Brightness: ${brightness}`);

                if (sharpness < 4.5)
                    return NextResponse.json({ success: false, feedback: "Image is blurry" })
                if (brightness < 40)
                    return NextResponse.json({ success: false, feedback: "Too dark" });
                if (brightness > 95)
                    return NextResponse.json({ success: false, feedback: "Too bright." });
            }
        }

        const textDetections = await checkTextClarity(buffer);
        console.log("Text Detections:", textDetections.map(t => ({ text: t.DetectedText, confidence: t.Confidence })));
        const clearText = textDetections.filter(t => (t.Confidence || 0) > 95);
        if (clearText.length < 4)
            return NextResponse.json({ success: false, feedback: "Hold steady." });
        return NextResponse.json({ success: true, feedback: "ID Detected!" });

    } catch (error: unknown) {
        console.error("Error detecting ID:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
