"use client";
import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ScanIdStepProps } from "@/types";
import toast from "react-hot-toast";
import { useRoboflow } from "@/hooks/useRoboflow";

const ROBOFLOW_CONFIG = {
    workspaceName: process.env.NEXT_PUBLIC_ROBOFLOW_WORKSPACE || "",
    workflowId: process.env.NEXT_PUBLIC_ROBOFLOW_WORKFLOW || ""
};

export function ScanIdStep({ onCapture, side }: ScanIdStepProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDetecting, setIsDetecting] = useState(true);
    const [feedback, setFeedback] = useState(`Move your ${side} ID into View`);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const captureImage = useCallback((file?: File) => {
        if (file) {
            setCapturedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setIsDetecting(false);
            toast.success("Image successfully captured");
        } else {
            toast.error("Capture failed. Please try again.");
        }
    }, []);

    const { isInitializing } = useRoboflow({
        isDetecting,
        onStable: captureImage,
        onFeedback: setFeedback,
        videoRef,
        canvasRef,
        side
    });

    const handleRetake = () => {
        setCapturedFile(null);
        setPreviewUrl(null);
        setFeedback(`Move your ${side} ID into View`);
        setIsDetecting(true);
    };

    const handleSubmit = () => {
        if (capturedFile)
            onCapture(capturedFile);
    };

    if (capturedFile && previewUrl) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900 capitalize">Review {side} of ID</h3>
                        <p className="text-gray-500 text-sm">
                            Check that your details are visible and in focus
                        </p>
                    </div>

                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                        <Image
                            src={previewUrl}
                            alt={`Captured ID ${side}`}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                    </div>

                    <div className="space-y-3 pt-4">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-3.5 bg-[#FF8A00] text-white font-semibold rounded-lg shadow-md hover:bg-[#E67A00] transition-colors active:scale-95 disabled:opacity-50"
                        >
                            Submit Photo
                        </button>
                        <button
                            onClick={handleRetake}
                            className="w-full py-3.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
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
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {isInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-700 font-medium text-sm">Starting Camera...</p>
                        <span className="text-xs text-gray-500">This may take a few seconds</span>
                    </div>
                )}

                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <div className="bg-gray-200/80 backdrop-blur-sm px-6 py-2 rounded-full text-gray-800 font-medium text-sm">
                        {feedback}
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <h3 className="font-bold text-lg capitalize">{side} of ID</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Place on a flat surface in a well-lit area and we&apos;ll take the photo automatically
                </p>
            </div>
        </div>
    );
}
