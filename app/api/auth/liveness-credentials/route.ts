import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { NextRequest, NextResponse } from "next/server";

const region = process.env.NEXT_PUBLIC_AWS_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS credentials (NEXT_PUBLIC_AWS_REGION, MY_AWS_ACCESS_KEY, MY_AWS_SECRET_ACCESS_KEY)");
}

const stsClient = new STSClient({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

export async function GET(req: NextRequest) {
    try {
        const roleArn = process.env.AWS_LIVENESS_ROLE_ARN;

        if (!roleArn) {
            console.warn("AWS_LIVENESS_ROLE_ARN is not set. Using direct credentials (NOT RECOMMENDED for production).");
            // Fallback for local dev if no role is set (only works if current creds are temporary, which they usually aren't for admin)
            // Ideally we MUST assume a role to get temporary credentials for the frontend.
            return NextResponse.json({ error: "AWS_LIVENESS_ROLE_ARN not configured" }, { status: 500 });
        }

        const command = new AssumeRoleCommand({
            RoleArn: roleArn,
            RoleSessionName: "FaceLivenessSession_" + Math.random().toString(36).substring(7),
            DurationSeconds: 900 // 15 minutes
        });

        const response = await stsClient.send(command);

        if (!response.Credentials) {
            throw new Error("Failed to obtain credentials");
        }

        return NextResponse.json({
            accessKeyId: response.Credentials.AccessKeyId,
            secretAccessKey: response.Credentials.SecretAccessKey,
            sessionToken: response.Credentials.SessionToken,
            expiration: response.Credentials.Expiration
        });

    } catch (error: any) {
        console.error("Error getting temporary credentials:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
