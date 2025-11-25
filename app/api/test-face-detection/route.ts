import { NextRequest, NextResponse } from "next/server";
import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";

// Initialize the client OUTSIDE the handler to save resources
const client = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  try {
    // 1. Read the image data from the request
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 2. Convert File to Buffer (AWS expects bytes)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Prepare the command for AWS Rekognition
    const command = new DetectFacesCommand({
      Image: {
        Bytes: buffer,
      },
      Attributes: ["ALL"], // Returns detailed facial analysis
    });

    // 4. Send to AWS
    const response = await client.send(command);

    return NextResponse.json({
      success: true,
      faces: response.FaceDetails
    });

  } catch (error: any) {
    console.error("AWS Rekognition Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}