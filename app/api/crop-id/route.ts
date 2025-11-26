import { NextRequest, NextResponse } from "next/server";
import { cropImage } from "@/lib/image-processing";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;
        const boundingBoxString = formData.get("boundingBox") as string;

        if (!image)
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });

        if (!boundingBoxString)
            return NextResponse.json({ success: false, error: "No bounding box provided" }, { status: 400 });

        const box = JSON.parse(boundingBoxString);
        const buffer = Buffer.from(await image.arrayBuffer());

        const croppedBuffer = await cropImage(buffer, box);

        return new NextResponse(new Blob([new Uint8Array(croppedBuffer)]), {
            headers: {
                "Content-Type": "image/jpeg",
                "Content-Length": croppedBuffer.length.toString(),
            },
        });

    } catch (error: unknown) {
        console.error("Error cropping ID:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
