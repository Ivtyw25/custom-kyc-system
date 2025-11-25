"use client";
import { useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";

interface ScanSelfieStepProps {
    onCapture: (file: File) => void;
}

export function ScanSelfieStep({ onCapture }: ScanSelfieStepProps) {
    const webcamRef = useRef<Webcam>(null);

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                fetch(imageSrc)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                        onCapture(file);
                    });
            }
        }
    }, [onCapture]);

    return (
        <div className="w-full h-full flex flex-col items-center relative animate-in fade-in duration-500">
            <div className="relative w-full aspect-[3/4] max-w-md bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="mt-6 space-y-4 w-full max-w-md">
                <h3 className="font-bold text-lg">Take a Selfie</h3>
                <button
                    onClick={handleCapture}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Camera className="w-5 h-5" />
                    Capture Selfie
                </button>
            </div>
        </div>
    );
}
