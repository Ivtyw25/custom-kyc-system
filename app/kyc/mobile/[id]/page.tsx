"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { IntroStep } from "@/components/mobile/IntroStep";
import { ScanIdStep } from "@/components/mobile/ScanIdStep";
import { UploadingStep } from "@/components/mobile/UploadingStep";
import { CompleteStep } from "@/components/mobile/CompleteStep";
import { ScanSelfieStep } from "@/components/mobile/ScanSelfieStep";
import { Files, Step } from "@/types";

export default function MobileCapture() {
    const params = useParams();
    const sessionId = params.id as string;
    const [step, setStep] = useState<Step>("intro");
    const [files, setFiles] = useState<Files>({});
    const [progress, setProgress] = useState(0);

    const handleIdCaptured = (file: File) => {
        if (step === "scan-id-front") {
            setFiles(prev => ({ ...prev, idFront: file }));
            setStep("scan-id-back");
            setProgress(50);
        } else if (step === "scan-id-back") {
            setFiles(prev => ({ ...prev, idBack: file }));
            setStep("scan-selfie");
            setProgress(75);
        }
    };

    const uploadAndVerify = async (idFront: File, idBack: File, selfie: File) => {
        setStep("uploading");
        setProgress(90);

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
            const idFrontKey = await uploadFile(idFront, "id-front");
            const idBackKey = await uploadFile(idBack, "id-back");
            const selfieKey = await uploadFile(selfie, "selfie");

            await fetch("/api/verify-identity", {
                method: "POST",
                body: JSON.stringify({
                    sessionId,
                    idFrontKey,
                    idBackKey,
                    selfieKey
                }),
            });

            setStep("complete");
            setProgress(100);
        } catch (err) {
            alert("Error uploading images");
            console.error(err);
            setStep("intro"); // Reset on error
        }
    };

    const handleSelfieCaptured = (file: File) => {
        const updatedFiles = { ...files, selfie: file };
        setFiles(updatedFiles);

        if (updatedFiles.idFront && updatedFiles.idBack) {
            uploadAndVerify(updatedFiles.idFront, updatedFiles.idBack, file);
        } else {
            console.error("ID Front, Back or Selfie not captured");
            setStep("intro");
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
                    <ScanIdStep onCapture={handleIdCaptured} sessionId={sessionId} side="front" />
                )}

                {step === "scan-id-back" && (
                    <ScanIdStep onCapture={handleIdCaptured} sessionId={sessionId} side="back" />
                )}

                {step === "scan-selfie" && (
                    <ScanSelfieStep onCapture={handleSelfieCaptured} sessionId={sessionId} />
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