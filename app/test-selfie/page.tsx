"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { ThemeProvider, Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json'
import { createLivenessSession, getLivenessResults } from '@/services/liveness';
import { themes } from '@/lib/constants';

const FaceLivenessDetector = dynamic(
    () => import('@aws-amplify/ui-react-liveness').then((mod) => mod.FaceLivenessDetector),
    { ssr: false }
);

Amplify.configure(outputs);

export default function TestSelfiePage() {
    const [sessionId] = useState(`test-session-${Math.random().toString(36).substring(7)}`);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [livenessSessionId, setLivenessSessionID] = useState<string | null>(null)
    const theme = themes;
    const fetchCreateLiveness = async () => {
        const data = await createLivenessSession(sessionId);
        setLivenessSessionID(data.sessionId);
        return { livenessSessionId: data.sessionId };
    };

    const handleAnalysisComplete = async () => {
        if (!sessionId || !livenessSessionId) return;

        try {
            const data = await getLivenessResults(livenessSessionId);

            if (data.isLive) {
                alert("Liveness Check Passed!");
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
        <ThemeProvider theme={theme}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h1 className="text-2xl font-bold mb-6">Test Face Liveness</h1>
                <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
                    <div className="mb-4 text-sm text-gray-500">
                        Test Session ID: <span className="font-mono">{sessionId}</span>
                    </div>

                    <div className="liveness-wrapper w-full h-[500px] relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-white">
                                <p className="text-red-600 font-medium mb-4">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : livenessSessionId ? (
                            <FaceLivenessDetector
                                key="liveness-detector-v10"
                                sessionId={livenessSessionId}
                                region={process.env.NEXT_PUBLIC_AWS_LIVENESS_REGION || "ap-northeast-1"}
                                onAnalysisComplete={handleAnalysisComplete}
                                onUserCancel={() => {
                                    setError("User cancelled the check.");
                                    setLivenessSessionID(null);
                                }}
                                onError={(err: unknown) => {
                                    console.error("Liveness Detector Error:", err);
                                    const message = err instanceof Error ? err.message : "An error occurred";
                                    setError(message);
                                    setLivenessSessionID(null);
                                }}
                                components={{
                                    PhotosensitiveWarning: () => null,
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            await fetchCreateLiveness();
                                        } catch (e: any) {
                                            console.error("Start session error:", e);
                                            setError(e.message || "Failed to start session");
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
                </div>
            </div>
        </ThemeProvider>
    );
}
