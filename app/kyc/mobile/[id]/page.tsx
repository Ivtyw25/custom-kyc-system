"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

interface Files {
    idFront?: File;
    selfie?: File;
}

export default function MobileCapture() {
    const { sessionId } = useParams();
    const [step, setStep] = useState(1); // 1: ID Front, 2: Selfie, 3: Done
    const [files, setFiles] = useState<Files>({});
    const [uploading, setUploading] = useState(false);

    const handleCapture = (e: any, type: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles((prev) => ({ ...prev, [type]: e.target.files[0] }));
        }
    };

    const uploadAndVerify = async () => {
        setUploading(true);

        const uploadFile = async (file: File, prefix: string) => {
            const fileName = `${sessionId}/${prefix}.jpg`;
            // 1. Get Presigned URL
            const res = await fetch("/api/s3-upload", {
                method: "POST",
                body: JSON.stringify({ fileName, fileType: file.type }),
            });
            const { uploadUrl } = await res.json();

            // 2. Upload to S3 directly
            await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
            return fileName; // Return the key
        };

        try {
            if (!files.idFront || !files.selfie) {
                throw new Error("Missing files");
            }
            const idKey = await uploadFile(files.idFront, "id-front");
            const selfieKey = await uploadFile(files.selfie, "selfie");

            // 3. Trigger Verification
            await fetch("/api/verify-identity", {
                method: "POST",
                body: JSON.stringify({ sessionId, idFrontKey: idKey, selfieKey }),
            });

            setStep(3);
        } catch (err) {
            alert("Error uploading images");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto min-h-screen bg-black text-white">
            {step === 1 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Step 1: Scan ID Card</h2>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment" // Forces rear camera
                        onChange={(e) => handleCapture(e, "idFront")}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-500 file:text-white"
                    />
                    {files.idFront && (
                        <button onClick={() => setStep(2)} className="w-full bg-blue-600 py-3 rounded-lg font-bold">
                            Next: Take Selfie
                        </button>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Step 2: Take Selfie</h2>
                    <input
                        type="file"
                        accept="image/*"
                        capture="user" // Forces front camera
                        onChange={(e) => handleCapture(e, "selfie")}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-500 file:text-white"
                    />
                    {files.selfie && (
                        <button
                            onClick={uploadAndVerify}
                            disabled={uploading}
                            className="w-full bg-green-600 py-3 rounded-lg font-bold"
                        >
                            {uploading ? "Verifying..." : "Submit Verification"}
                        </button>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="text-center pt-20">
                    <h1 className="text-3xl">🎉 Done!</h1>
                    <p className="mt-4 text-gray-400">Please check your desktop screen.</p>
                </div>
            )}
        </div>
    );
}