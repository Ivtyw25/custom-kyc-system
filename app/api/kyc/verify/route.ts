import { NextRequest, NextResponse } from "next/server";
import { GetFaceLivenessSessionResultsCommand, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { rekognitionLivenessClient, s3LivenessClient } from "@/lib/aws/clients";
import { analyzeId } from "@/services/id-ocr";
import { supabase } from "@/lib/supabase";
import { compareOcrResult, updateSessionOCRData } from "@/services/session";

const bucketName = process.env.AWS_S3_BUCKET;

export async function POST(req: NextRequest) {
    console.log("KYC Verification API called");
    try {
        const body = await req.json();
        const { sessionId, livenessSessionId, profileId, idFrontKey, idBackKey } = body;

        console.log("Request params:", { sessionId, livenessSessionId, profileId, idFrontKey, idBackKey });

        if (!sessionId || !livenessSessionId || !idFrontKey || !idBackKey) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        await updateStatus(sessionId, "processing");

        // 1. Get Liveness Results
        console.log("Step 1: Fetching liveness results for:", livenessSessionId);
        const livenessCommand = new GetFaceLivenessSessionResultsCommand({ SessionId: livenessSessionId });
        const livenessResponse = await rekognitionLivenessClient.send(livenessCommand);
        const isLive = livenessResponse.Confidence && livenessResponse.Confidence > 70;

        console.log("Liveness check result:", { isLive, confidence: livenessResponse.Confidence });

        if (!isLive) {
            await updateStatus(sessionId, "failed");
            return NextResponse.json({ success: false, error: "Liveness check failed" });
        }

        // 2. Face Comparison
        console.log("Step 2: Comparing faces...");
        const selfieKey = `${sessionId}/${livenessSessionId}/reference.jpg`;
        const compareParams = {
            SourceImage: { S3Object: { Bucket: bucketName, Name: idFrontKey } },
            TargetImage: { S3Object: { Bucket: bucketName, Name: selfieKey } },
            SimilarityThreshold: 80,
        };
        const compareCommand = new CompareFacesCommand(compareParams);
        const compareResponse = await rekognitionLivenessClient.send(compareCommand);
        const match = compareResponse.FaceMatches && compareResponse.FaceMatches.length > 0;
        const faceSimilarity = match ? compareResponse.FaceMatches?.[0]?.Similarity ?? 0 : 0;
        const isFaceMatched = faceSimilarity > 80;

        console.log("Face comparison result:", { isFaceMatched, similarity: faceSimilarity });

        if (!isFaceMatched) {
            await updateStatus(sessionId, "failed");
            return NextResponse.json({ success: false, error: "Face comparison failed" });
        }

        // 3. Fetch Images for OCR
        console.log("Step 3: Fetching images from S3 for OCR...");
        const frontBuffer = await getS3Object(idFrontKey);
        const backBuffer = await getS3Object(idBackKey);

        // 4. Perform OCR
        console.log("Step 4: Performing OCR with Gemini...");
        const ocrResult = await analyzeId(frontBuffer, backBuffer);
        if (!ocrResult) {
            await updateStatus(sessionId, "failed");
            return NextResponse.json({ success: false, error: "OCR extraction failed" });
        }

        // 5. Update OCR Data in DB
        console.log("Step 5: Saving OCR data to database...");
        await updateSessionOCRData(sessionId, ocrResult);

        // 6. Compare OCR with Profile
        console.log("Step 6: Comparing OCR results with profile...");
        const isOcrMatch = await compareOcrResult(ocrResult, profileId);
        console.log("OCR match result:", isOcrMatch);

        if (isOcrMatch) {
            await updateStatus(sessionId, "success");
            return NextResponse.json({ success: true, message: "Verification successful" });
        } else {
            await updateStatus(sessionId, "failed");
            return NextResponse.json({ success: false, error: "Identity verification failed (information mismatch)" });
        }

    } catch (error: any) {
        console.error("KYC Verification API Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: error.stack
        }, { status: 500 });
    }
}

async function getS3Object(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3LivenessClient.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) throw new Error("Failed to transform S3 body to byte array");
    return Buffer.from(byteArray);
}

async function updateStatus(sessionId: string, status: string) {
    console.log(`Updating session ${sessionId} status to: ${status}`);
    const { error } = await supabase
        .from('verification_sessions')
        .update({ status })
        .eq('id', sessionId);
    if (error) {
        console.error("Failed to update status in DB:", error);
    }
}
