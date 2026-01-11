"use server";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema = z.object({
    name: z.string().describe("Full legal name as shown on the identity card"),
    nricNumber: z.string().describe("The Malaysian identity card number in the format YYMMDD-SS-####."),
    address: z.object({
        unit: z.string().describe("The Unit, apartment, floor or block number (if applicable)"),
        street: z.string().describe("The street address as shown on the identity card, the street name and building name (e.g, Jalan / Lorong ABC"),
        city: z.string().describe("City or major town of the address"),
        state: z.string().describe("The state where the location is located"),
        postcode: z.string().describe("5-digit Malaysian postal code"),
    }),
    gender: z.enum(['male', 'female']).describe("The gender of the person. LELAKI for 'male' PEREMPUAN for 'female'"),
    back: z.object({
        nricNumber: z.string().describe("The number that is on the back of the identity card, usually is in the format of yymmdd-ss-####-##-##"),
    })
});

export async function analyzeIdImages(formData: FormData) {
    const idFront = formData.get("idFront") as File;
    const idBack = formData.get("idBack") as File;

    if (!idFront || !idBack) {
        throw new Error("Missing ID images");
    }

    const frontBuffer = Buffer.from(await idFront.arrayBuffer());
    const backBuffer = Buffer.from(await idBack.arrayBuffer());

    return analyzeId(frontBuffer, backBuffer, idFront.type);
}

export async function analyzeId(frontBuffer: Buffer, backBuffer: Buffer, mimeType: string = 'image/jpeg') {
    try {
        const contents = [
            { text: "Extract the information from this Malaysian Identity Card (MyKad). The first image is the front, and the second image is the back." },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: frontBuffer.toString("base64")
                }
            },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: backBuffer.toString("base64")
                }
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(schema),
            },
        });

        const result = JSON.parse(response.text || "{}");
        console.log("OCR Result:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error("ID OCR Error:", error);
        return null;
    }
}