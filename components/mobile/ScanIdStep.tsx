"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Image from "next/image";

interface ScanIdStepProps {
    onCapture: (file: File) => void;
    sessionId: string;
}

export function ScanIdStep({ onCapture, sessionId }: ScanIdStepProps) {
    const webcamRef = useRef<Webcam>(null);
    const [isDetecting, setIsDetecting] = useState(true);
    const [feedback, setFeedback] = useState("Move your ID into View");
    const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const analyzeFrame = useCallback(async () => {
        if (!webcamRef.current || !isDetecting) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const blob = await (await fetch(imageSrc)).blob()
        const formData = new FormData();
        formData.append("image", blob as File);
        formData.append("sessionId", sessionId)

        try {
            const res = await fetch("/api/detect-id", {
                method: "POST",
                body: formData,
            })
            const data = await res.json();

            if (data.success) {
                setFeedback("ID Captured Successfully!");
                setIsDetecting(false);

                // Create file and preview URL
                const file = new File([blob], "id-front.jpg", { type: "image/jpeg" });
                setCapturedFile(file);
                setPreviewUrl(URL.createObjectURL(blob));

            } else if (data.feedback) {
                setFeedback(data.feedback);
            }
        } catch (error) {
            console.error("Detection error:", error);
        }
    }, [isDetecting, sessionId])

    useEffect(() => {
        if (isDetecting) {
            const interval = setInterval(() => { analyzeFrame(); }, 3000);
            setScanInterval(interval);
        } else {
            if (scanInterval) clearInterval(scanInterval);
        }
        return () => {
            if (scanInterval) clearInterval(scanInterval);
        }
    }, [isDetecting, analyzeFrame]);

    const handleRetake = () => {
        setCapturedFile(null);
        setPreviewUrl(null);
        setFeedback("Move your ID into View");
        setIsDetecting(true);
    };

    const handleSubmit = () => {
        if (capturedFile) {
            onCapture(capturedFile);
        }
    };

    // Review UI
    if (capturedFile && previewUrl) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">Review front of ID</h3>
                        <p className="text-gray-500 text-sm">
                            Check that your details are visible and in focus
                        </p>
                    </div>

                    <div className="relative w-full aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                        <Image
                            src={previewUrl}
                            alt="Captured ID"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="space-y-3 pt-4">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-3.5 bg-[#FF8A00] text-white font-semibold rounded-lg shadow-md hover:bg-[#E67A00] transition-colors active:scale-[0.98]"
                        >
                            Submit Photo
                        </button>
                        <button
                            onClick={handleRetake}
                            className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                            Retake Photo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center relative animate-in fade-in duration-500">
            <div className="relative w-full aspect-3/4 max-w-md bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] aspect-[1.586] border-2 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                </div>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <div className="bg-gray-200/80 backdrop-blur-sm px-6 py-2 rounded-full text-gray-800 font-medium text-sm">
                        {feedback}
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <h3 className="font-bold text-lg">Front of ID</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Place on a flat surface in a well-lit area and we'll take the photo automatically
                </p>
            </div>
        </div>
    );
}
