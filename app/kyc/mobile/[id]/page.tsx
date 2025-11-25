"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { IntroStep } from "@/components/mobile/IntroStep";
import { ScanIdStep } from "@/components/mobile/ScanIdStep";
import { ScanSelfieStep } from "@/components/mobile/ScanSelfieStep";
import { UploadingStep } from "@/components/mobile/UploadingStep";
import { CompleteStep } from "@/components/mobile/CompleteStep";

interface Files {
    idFront?: File;
    selfie?: File;
}

type Step = "intro" | "scan-id-front" | "scan-selfie" | "uploading" | "complete";

export default function MobileCapture() {
    const params = useParams();
    const sessionId = params.id as string;
    const [step, setStep] = useState<Step>("intro");
    const [files, setFiles] = useState<Files>({});
    const [progress, setProgress] = useState(0);

    const handleIdCaptured = (file: File) => {
        setFiles(prev => ({ ...prev, idFront: file }));
        setStep("scan-selfie");
        setProgress(50);
    };

    const handleSelfieCaptured = (file: File) => {
        setFiles(prev => ({ ...prev, selfie: file }));
        if (files.idFront) {
            uploadAndVerify(files.idFront, file);
        } else {
            console.error("ID Front missing during selfie capture");
            setStep("intro");
        }
    };

    const uploadAndVerify = async (idFront: File, selfie: File) => {
        setStep("uploading");
        setProgress(75);

        const uploadFile = async (file: File, prefix: string) => {
            const fileName = `${sessionId}/${prefix}.${file.type.split("/")[1]}`;
            const res = await fetch("/api/s3-upload", {
                method: "POST",
                body: JSON.stringify({ fileName, fileType: file.type }),
            });
            const { uploadUrl } = await res.json();
            await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
            return fileName;
        };

        try {
            const idKey = await uploadFile(idFront, "id-front");
            const selfieKey = await uploadFile(selfie, "selfie");

            await fetch("/api/verify-identity", {
                method: "POST",
                body: JSON.stringify({ sessionId, idFrontKey: idKey, selfieKey }),
            });

            setStep("complete");
            setProgress(100);
        } catch (err) {
            alert("Error uploading images");
            console.error(err);
            setStep("intro"); // Reset on error
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background justify-center items-center p-4">
            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white p-12 rounded-3xl shadow-lg text-center max-w-lg w-full border border-gray-200">

                {/* Progress Bar */}
                <div className="w-full p-4 mb-4">
                    <Progress value={progress} className="h-2" />
                </div>

                {step === "intro" && (
                    <IntroStep onNext={() => {
                        setStep("scan-id-front");
                        setProgress(25);
                    }} />
                )}

                {step === "scan-id-front" && (
                    <ScanIdStep onCapture={handleIdCaptured} sessionId={sessionId} />
                )}

                {step === "scan-selfie" && (
                    <ScanSelfieStep onCapture={handleSelfieCaptured} />
                )}

                {step === "uploading" && (
                    <UploadingStep />
                )}

                {step === "complete" && (
                    <CompleteStep />
                )}
            </motion.div>
        </div>
    );
}