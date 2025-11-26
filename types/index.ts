export interface Files {
    idFront?: File;
    idBack?: File;
    selfie?: File;
}

export type Step = "intro" | "scan-id-front" | "scan-id-back" | "scan-selfie" | "uploading" | "complete";

export interface ScanIdStepProps {
    onCapture: (file: File) => void;
    sessionId: string;
    side: "front" | "back";
}

export interface ScanSelfieStepProps {
    onCapture: (file: File) => void;
    sessionId: string;
}

export interface IntroStepProps {
    onNext: () => void;
}
