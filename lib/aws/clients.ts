import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const livenessRegion = process.env.NEXT_PUBLIC_AWS_LIVENESS_REGION || process.env.AWS_LIVENESS_REGION || "ap-northeast-1";

if (!region || !accessKeyId || !secretAccessKey) {
    console.error("Missing AWS configuration");
}

export const rekognitionClient = new RekognitionClient({
    region: region,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || ""
    }
});

export const rekognitionLivenessClient = new RekognitionClient({
    region: livenessRegion,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || ""
    }
});


export const s3LivenessClient = new S3Client({
    region: livenessRegion,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || ""
    }
});
