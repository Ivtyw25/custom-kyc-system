export interface Files {
    idFront?: File;
    idBack?: File;
}

export type Step = "intro-id-front" | "intro-id-back" | "intro-selfie" | "scan-id-front" | "scan-id-back" | "scan-selfie" | "uploading" | "complete";

export interface ScanIdStepProps {
    onCapture: (file: File) => void;
    side: "front" | "back";
}

export interface ScanSelfieStepProps {
    sessionId: string;
    files: Files;
}

export interface IntroStepProps {
    onNext: () => void;
    title: string;
    description: string;
    icon?: "id" | "selfie";
}

import { RefObject } from "react";

export interface UseRoboflowProps {
    isDetecting: boolean;
    onStable: (file?: File) => void;
    onFeedback: (msg: string) => void;
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    side: "front" | "back";
}
