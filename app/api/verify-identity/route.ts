import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const region = process.env.AWS_REGION;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucketName = process.env.AWS_S3_BUCKET;

if (!region || !supabase_url || !supabase_anon_key || !bucketName) {
    throw new Error("Missing AWS configuration or Supabase configuration");
}

const rekognition = new RekognitionClient({ region: region });
const supabase = createClient(supabase_url, supabase_anon_key);

export async function POST(req: NextRequest) {
    const { sessionId, idFrontKey, selfieKey } = await req.json();

    // 1. Ask AWS Rekognition to compare the faces
    const command = new CompareFacesCommand({
        SourceImage: { S3Object: { Bucket: bucketName, Name: idFrontKey } }, // ID Card
        TargetImage: { S3Object: { Bucket: bucketName, Name: selfieKey } },  // Selfie
        SimilarityThreshold: 80,
    });

    try {
        const response = await rekognition.send(command);
        const match = response.FaceMatches && response.FaceMatches.length > 0;
        const confidence = match ? response.FaceMatches?.[0]?.Similarity ?? 0 : 0;
        const isVerified = confidence > 80; // Custom logic: Valid only if > 80% match

        // 2. Update Supabase (Desktop will see this instantly via Realtime)
        await supabase
            .from('verification_sessions')
            .update({
                status: isVerified ? 'success' : 'failed',
                match_confidence: confidence
            })
            .eq('id', sessionId);

        return NextResponse.json({ success: true, confidence });

    } catch (error: any) {
        console.error("Rekognition Error:", error);
        await supabase.from('verification_sessions').update({ status: 'error' }).eq('id', sessionId);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}