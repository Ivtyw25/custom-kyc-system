import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucketName = process.env.AWS_S3_BUCKET;

if (!region || !accessKeyId || !secretAccessKey || !supabase_url || !supabase_anon_key || !bucketName) {
    console.error("Missing configuration:", {
        region,
        accessKeyId: accessKeyId ? accessKeyId.substring(0, 5) + "..." : undefined,
        hasSecret: !!secretAccessKey,
        bucketName
    });
    throw new Error("Missing AWS configuration or Supabase configuration");
}

const rekognition = new RekognitionClient({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    }
});


const supabase = createClient(supabase_url, supabase_anon_key);

export async function POST(req: NextRequest) {
    try {
        const { sessionId, idFrontKey, selfieKey } = await req.json();

        console.log("Verify Identity Request:", { sessionId, idFrontKey, selfieKey });

        // Validate all required parameters
        if (!bucketName || !idFrontKey || !selfieKey || !region) {
            console.error("Missing required parameters:", {
                hasBucketName: !!bucketName,
                hasIdFrontKey: !!idFrontKey,
                hasSelfieKey: !!selfieKey,
                hasRegion: !!region,
                bucketName,
                region
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

        console.log("=== REKOGNITION DEBUG INFO ===");
        console.log("Bucket Name:", bucketName);
        console.log("ID Front Key:", idFrontKey);
        console.log("Selfie Key:", selfieKey);
        console.log("Region:", region);
        console.log("Rekognition Parameters:", JSON.stringify(rekognitionParams, null, 2));
        console.log("==============================");

        const command = new CompareFacesCommand(rekognitionParams);

        console.log("Sending Rekognition Command...");
        const response = await rekognition.send(command);
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

        console.log("Supabase Update Result:", supabaseResult);

        return NextResponse.json({ success: true, confidence });

    } catch (error: any) {
        console.error("=== VERIFY IDENTITY ERROR ===");
        console.error("Error Type:", error.constructor.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        console.error("Full Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        return NextResponse.json({
            success: false,
            error: error.message,
            errorType: error.constructor.name
        }, { status: 500 });
    }
}