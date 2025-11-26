import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rekognitionClient } from "@/lib/aws/clients";

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucketName = process.env.AWS_S3_BUCKET;

if (!supabase_url || !supabase_anon_key || !bucketName) {
    console.error("Missing configuration:", {
        hasSupabaseUrl: !!supabase_url,
        hasSupabaseKey: !!supabase_anon_key,
        bucketName
    });
    throw new Error("Missing AWS configuration or Supabase configuration");
}

const supabase = createClient(supabase_url, supabase_anon_key);

export async function POST(req: NextRequest) {
    try {
        const { sessionId, idFrontKey, selfieKey } = await req.json();

        console.log("Verify Identity Request:", { sessionId, idFrontKey, selfieKey });

        // Validate all required parameters
        if (!bucketName || !idFrontKey || !selfieKey) {
            console.error("Missing required parameters:", {
                hasBucketName: !!bucketName,
                hasIdFrontKey: !!idFrontKey,
                hasSelfieKey: !!selfieKey,
                bucketName,
            });
            return NextResponse.json({
                success: false,
                error: "Missing required AWS parameters"
            }, { status: 400 });
        }

        // 1. Ask AWS Rekognition to compare the faces
        const rekognitionParams = {
            SourceImage: { S3Object: { Bucket: bucketName, Name: idFrontKey } }, // ID Card
            TargetImage: { S3Object: { Bucket: bucketName, Name: selfieKey } },  // Selfie
            SimilarityThreshold: 80,
        };


        const command = new CompareFacesCommand(rekognitionParams);

        console.log("Sending Rekognition Command...");
        const response = await rekognitionClient.send(command);
        console.log("Rekognition Response:", JSON.stringify(response, null, 2));

        const match = response.FaceMatches && response.FaceMatches.length > 0;
        const confidence = match ? response.FaceMatches?.[0]?.Similarity ?? 0 : 0;
        const isVerified = confidence > 80; // Custom logic: Valid only if > 80% match

        console.log("Match Result:", { match, confidence, isVerified });

        // 2. Update Supabase (Desktop will see this instantly via Realtime)
        console.log("Updating Supabase...");
        const supabaseResult = await supabase
            .from('verification_sessions')
            .update({
                status: isVerified ? 'success' : 'failed',
                match_confidence: confidence
            })
            .eq('id', sessionId);

        return NextResponse.json({ success: true, confidence });

    } catch (error: unknown) {
        console.error("=== VERIFY IDENTITY ERROR ===");
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error Type:", err.constructor.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);

        return NextResponse.json({
            success: false,
            error: err.message,
            errorType: err.constructor.name
        }, { status: 500 });
    }
}