import { RekognitionClient } from "@aws-sdk/client-rekognition";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

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
