"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { ThemeProvider, Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json'
import { createLivenessSession, getLivenessResults } from '@/services/liveness';
import { themes } from '@lib/constants'
import { ScanSelfieStepProps } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadFile, compareFaces } from '@/services/id-verification';

const FaceLivenessDetector = dynamic(
    () => import('@aws-amplify/ui-react-liveness').then((mod) => mod.FaceLivenessDetector),
    { ssr: false }
);


Amplify.configure(outputs);
const customTheme: Theme = themes;

export function ScanSelfieStep({ sessionId, files }: ScanSelfieStepProps) {
    const [loading, setLoading] = useState(false);
    const [livenessSessionId, setLivenessSessionID] = useState<string | null>(null)
    const router = useRouter();

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

    const handleFailure = async (errorMessage: string) => {
        console.error(errorMessage);
        toast.error(errorMessage);
        setLivenessSessionID(null);

        try {
            await fetch("/api/verification-session/status", {
                method: "POST",
                body: JSON.stringify({ sessionId, status: "failed" }),
            });
            router.push("/kyc/failed");
        } catch (err) {
            console.error("Failed to update session status", err);
        }
    };

    const handleAnalysisComplete = async () => {
        if (!livenessSessionId || !files.idFront || !files.idBack) return;
        try {
            const data = await getLivenessResults(livenessSessionId);
            if (data.isLive) {
                toast.success("Liveness check passed, processing your verification");
                await fetch("/api/verification-session/status", {
                    method: "POST",
                    body: JSON.stringify({ sessionId, status: "processing" }),
                });
                router.push("/kyc/processing");
                const frontIdKey = await uploadFile(files.idFront, "id-front", sessionId);
                const backIdKey = await uploadFile(files.idBack, "id-back", sessionId);
                const selfieKey = `${sessionId}/${livenessSessionId}/reference.jpg`;

                const compareResult = await compareFaces(frontIdKey, selfieKey);
                if (!compareResult.success) {
                    handleFailure("Face comparison failed. Please try again.");
                    return;
                }

                await fetch("/api/verification-session/status", {
                    method: "POST",
                    body: JSON.stringify({ sessionId, status: "success" }),
                });
                router.push("/kyc/success");
            } else {
                handleFailure("Liveness check failed. Please try again.");
                setLivenessSessionID(null);
            }
        } catch (err) {
            console.error(err);
            handleFailure("Error verifying liveness results.");
        }
    };

    return (
        <ThemeProvider theme={customTheme}>
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="liveness-wrapper w-full max-w-md h-[500px] relative bg-gray-100 rounded-xl overflow-hidden">
                    {livenessSessionId && !loading ? (
                        <FaceLivenessDetector
                            sessionId={livenessSessionId}
                            region={process.env.NEXT_PUBLIC_AWS_LIVENESS_REGION ||  "ap-northeast-1"}
                            onAnalysisComplete={handleAnalysisComplete}
                            onUserCancel={async () => {
                                await handleFailure("User cancelled the check.");
                            }}
                            onError={async (err: unknown) => {
                                const message = err instanceof Error ? err.message :     "An error occurred";
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
