"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';

const FaceLivenessDetector = dynamic(
    () => import('@aws-amplify/ui-react-liveness').then((mod) => mod.FaceLivenessDetector),
    { ssr: false }
);

interface ScanSelfieStepProps {
    onCapture: (file: File) => void;
    sessionId: string;
}

Amplify.configure({
    Auth: {
        Cognito: {
            identityPoolId: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID || process.env.AWS_IDENTITY_POOL || "",
            allowGuestAccess: true,
        },
    },
});

export function ScanSelfieStep({ onCapture, sessionId }: ScanSelfieStepProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [livenessSessionId, setLivenessSessionID] = useState<string | null>(null)

    const fetchCreateLiveness = async () => {
        const response = await fetch('/api/face-liveness/create-session', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        setLivenessSessionID(data.sessionId);
        return { livenessSessionId: data.sessionId };
    };

    const handleAnalysisComplete = async () => {
        if (!sessionId) return;

        try {
            const response = await fetch('/api/face-liveness/get-results', {
                method: 'POST',
                body: JSON.stringify({ livenessSessionId }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.isLive) {
            } else {
                setError("Liveness check failed. Please try again.");
                setLivenessSessionID(null); // Reset to allow retry
            }
        } catch (err) {
            console.error(err);
            setError("Error verifying liveness results.");
        }
    };

    return (
        <ThemeProvider>
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
                {error ? (
                    <div className="text-center space-y-4">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-md h-[500px] relative bg-gray-100 rounded-xl overflow-hidden">
                        {livenessSessionId ? (
                            <FaceLivenessDetector
                                sessionId={livenessSessionId}
                                region={process.env.NEXT_PUBLIC_AWS_REGION || "ap-southeast-1"}
                                onAnalysisComplete={handleAnalysisComplete}
                                onUserCancel={() => {
                                    setError("User cancelled the check.");
                                    setLivenessSessionID(null);
                                }}
                                onError={(err: any) => {
                                    setError(err.message || "An error occurred");
                                    setLivenessSessionID(null);
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            await fetchCreateLiveness();
                                        } catch (e) {
                                            setError("Failed to start session");
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "Start Liveness Check"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ThemeProvider>
    );
}
