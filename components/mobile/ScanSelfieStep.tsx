"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { ThemeProvider, Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json'
import { createLivenessSession } from '@/services/liveness';
import { themes } from '@lib/constants'
import { ScanSelfieStepProps } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadFile } from '@/services/id-verification';
import { updateSessionStatus } from "@/services/session";

const FaceLivenessDetector = dynamic(
    () => import('@aws-amplify/ui-react-liveness').then((mod) => mod.FaceLivenessDetector),
    { ssr: false }
);


Amplify.configure(outputs);
const customTheme: Theme = themes;

export function ScanSelfieStep({ sessionId, files, profileId }: ScanSelfieStepProps) {
    const [loading, setLoading] = useState(false);
    const [livenessSessionId, setLivenessSessionID] = useState<string | null>(null)
    const router = useRouter();

    const handleFailure = async (errorMessage: string) => {
        console.error(errorMessage);
        toast.error(errorMessage);
        setLivenessSessionID(null);

        try {
            await updateSessionStatus(sessionId, "failed");
            router.push("/kyc/failed");
        } catch (err) {
            console.error("Failed to update session status", err);
        }
    };

    useEffect(() => {
        const startSession = async () => {
            setLoading(true);
            try {
                const data = await createLivenessSession(sessionId);
                setLivenessSessionID(data.sessionId);
            } catch {
                handleFailure("Failed to start session");
            } finally {
                setLoading(false);
            }
        };
        startSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnalysisComplete = async () => {
        if (!livenessSessionId || !files.idFront || !files.idBack) return;
        setLoading(true);
        try {
            toast.loading("Processing your verification...", { id: "kyc-verify" });

            // First, upload the ID images
            const frontIdKey = await uploadFile(files.idFront, "id-front", sessionId);
            const backIdKey = await uploadFile(files.idBack, "id-back", sessionId);

            // Call the consolidated API
            const response = await fetch("/api/kyc/verify", {
                method: "POST",
                body: JSON.stringify({
                    sessionId,
                    livenessSessionId,
                    profileId,
                    idFrontKey: frontIdKey,
                    idBackKey: backIdKey
                }),
                headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Verification successful!", { id: "kyc-verify" });
                router.push("/kyc/success");
            } else {
                toast.error(result.error || "Verification failed", { id: "kyc-verify" });
                handleFailure(result.error || "Verification failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during verification", { id: "kyc-verify" });
            handleFailure("Error verifying results.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={customTheme}>
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="liveness-wrapper w-full max-w-md h-[500px] relative bg-gray-100 rounded-xl overflow-hidden">
                    {livenessSessionId && !loading ? (
                        <FaceLivenessDetector
                            sessionId={livenessSessionId}
                            region={process.env.NEXT_PUBLIC_AWS_LIVENESS_REGION || "ap-northeast-1"}
                            onAnalysisComplete={handleAnalysisComplete}
                            onUserCancel={async () => {
                                await handleFailure("User cancelled the check.");
                            }}
                            onError={async (err: unknown) => {
                                const message = err instanceof Error ? err.message : "An error occurred";
                                await handleFailure(message);
                            }}
                            components={{
                                PhotosensitiveWarning: () => null,
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                            <p className="text-gray-600 font-medium">Initializing camera...</p>
                        </div>
                    )}
                </div>

            </div>
        </ThemeProvider>
    );
}
