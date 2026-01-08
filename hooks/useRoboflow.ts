import { useRef, useEffect, useCallback, useState } from "react";
import { connectors, webrtc, streams } from "@roboflow/inference-sdk";
import toast from "react-hot-toast";
import { drawOverlay } from "@/lib/drawing";
import { UseRoboflowProps } from "@/types";

export function useRoboflow({ isDetecting, onStable, onFeedback, videoRef, canvasRef, side }: UseRoboflowProps) {
    const connectionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const consecutiveDetectionsRef = useRef(0);
    const lastBoxRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);
    const lastLogTimeRef = useRef<number>(0);

    const [isInitializing, setIsInitializing] = useState(true);

    const cleanup = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.cleanup();
            connectionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const initializingRef = useRef(false);

    const initRoboflow = useCallback(async () => {
        if (initializingRef.current) return;
        initializingRef.current = true;

        try {
            setIsInitializing(true);
            const stream = await streams.useCamera({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.log("Play aborted", e));
            }

            const connector = connectors.withProxyUrl("/api/roboflow-proxy");
            const connection = await webrtc.useStream({
                source: stream,
                connector,
                wrtcParams: {
                    workspaceName: process.env.NEXT_PUBLIC_ROBOFLOW_WORKSPACE,
                    workflowId: process.env.NEXT_PUBLIC_ROBOFLOW_WORKFLOW,
                    imageInputName: "image",
                    streamOutputNames: [],
                    dataOutputNames: ["*"],
                },
                options: {
                    disableInputStreamDownscaling: true
                },
                onData: (data: any) => {
                    if (!isDetecting) return;
                    const result = Array.isArray(data) ? data[0] : data;

                    if (!result) return;

                    const raw = result.serialized_output_data;
                    const variance = raw.variance;
                    const predictions = raw.boxes?.predictions || [];
                    const pred = predictions.length > 0 ? predictions[0] : null;
                    const cropData = raw.dynamic_crop?.[0]?.crops || null;

                    // Detailed logging for production debugging
                    console.log("[Roboflow] Frame Data:", {
                        variance: variance,
                        predictions: predictions.length,
                    });

                    // Send variance to Vercel logs (throttled to every 2 seconds)
                    if (typeof variance === 'number') {
                        const now = Date.now();
                        if (now - lastLogTimeRef.current > 2000) {
                            lastLogTimeRef.current = now;
                            fetch('/api/debug/variance', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    variance,
                                    side,
                                    timestamp: new Date().toISOString()
                                })
                            }).catch(err => console.error("Failed to send variance log:", err));
                        }
                    }

                    if (canvasRef.current && videoRef.current) {
                        drawOverlay(canvasRef.current, videoRef.current, pred, consecutiveDetectionsRef.current >= 10);
                    }

                    // 1. Check for blur
                    if (typeof variance === 'number' && variance <= 80) {
                        onFeedback("Image is blurry");
                        consecutiveDetectionsRef.current = 0;
                        return;
                    }

                    // 2. Check for detections
                    if (!pred) {
                        onFeedback("ID not detected");
                        consecutiveDetectionsRef.current = 0;
                        lastBoxRef.current = null;
                        return;
                    }

                    // 3. Check for correct side
                    const expectedClass = side === "front" ? "IC-Front" : "IC-Back";
                    if (pred.class !== expectedClass) {
                        onFeedback(`Wrong side detected. Please show ${side}.`);
                        consecutiveDetectionsRef.current = 0;
                        return;
                    }

                    // 4. Stability check
                    let isMoving = false;
                    if (lastBoxRef.current) {
                        const dx = Math.abs(pred.x - lastBoxRef.current.x);
                        const dy = Math.abs(pred.y - lastBoxRef.current.y);
                        if (dx > 30 || dy > 30) {
                            isMoving = true;
                        }
                    }
                    lastBoxRef.current = pred;

                    if (isMoving) {
                        onFeedback("Please hold still");
                        consecutiveDetectionsRef.current = 0;
                    } else {
                        consecutiveDetectionsRef.current += 1;
                        onFeedback("Hold still...");
                    }

                    if (consecutiveDetectionsRef.current >= 20) {
                        onFeedback("Image successfully captured");

                        if (cropData && cropData.value) {
                            try {
                                const base64String = cropData.value;
                                const byteCharacters = atob(base64String);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: "image/jpeg" });
                                const file = new File([blob], "captured_id.jpg", { type: "image/jpeg" });
                                onStable(file);
                            } catch (e) {
                                console.error("Error converting crop to file:", e);
                                onStable();
                            }
                        } else {
                            onStable();
                        }
                    }
                }
            });
            connectionRef.current = connection;
            setIsInitializing(false);

        } catch (error: any) {
            console.error("Failed to init Roboflow:", error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error("Camera permission denied. Please allow camera access in your browser settings.", { id: "camera-error" });
            } else {
                toast.error("Connection terminated. Please refresh to try again.", { id: "connection-error" });
            }
            setIsInitializing(false);
        } finally {
            initializingRef.current = false;
        }
    }, [isDetecting, onStable, onFeedback, videoRef, canvasRef, side]);

    useEffect(() => {
        if (isDetecting) {
            initRoboflow();
        }
        return () => {
            cleanup();
        };
    }, [isDetecting, initRoboflow, cleanup]);

    return { cleanup, isInitializing };
}
