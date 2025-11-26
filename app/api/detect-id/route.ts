import { NextRequest, NextResponse } from "next/server";
import {
    validateIdLabel,
    checkFaceQuality,
    checkTextClarity,
    calculateBoundingBox
} from "@/lib/id-validation";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image");

        if (!image || typeof image === "string") {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const idLabel = await validateIdLabel(buffer);

        if (!idLabel) {
            return NextResponse.json({ success: false, feedback: "Move your ID into view" });
        }

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

        const textDetections = await checkTextClarity(buffer);
        const clearText = textDetections.filter(t => (t.Confidence || 0) > 95);
        if (clearText.length < 5)
            return NextResponse.json({ success: false, feedback: "Hold steady." });

        const avgConfidence = clearText.reduce((acc, curr) => acc + (curr.Confidence || 0), 0) / clearText.length;

        if (avgConfidence < 95)
            return NextResponse.json({ success: false, feedback: "Ensure good lighting and avoid glare." });

        const boundingBox = calculateBoundingBox(clearText);

        return NextResponse.json({ success: true, feedback: "ID Detected!", boundingBox });

    } catch (error: any) {
        console.error("Error detecting ID:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
