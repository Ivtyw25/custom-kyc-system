import { useRef, useEffect, useCallback } from "react";
import { connectors, webrtc, streams } from "@roboflow/inference-sdk";
import toast from "react-hot-toast";
import { drawOverlay } from "@/lib/drawing";
import { UseRoboflowProps } from "@/types";

export function useRoboflow({ workspaceName, workflowId, isDetecting, onStable, onFeedback, videoRef, canvasRef, side }: UseRoboflowProps) {
    const connectionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const consecutiveDetectionsRef = useRef(0);
    const lastBoxRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);

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

    const initRoboflow = useCallback(async () => {
        try {
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
                    workspaceName,
                    workflowId,
                    imageInputName: "image",
                    streamOutputNames: [],
                    dataOutputNames: ["*"],
                },
                onData: (data: any) => {
                    if (!isDetecting) return;

                    // Handle array response from workflow
                    const result = Array.isArray(data) ? data[0] : data;
                    if (!result) return;

                    const isNotBlur = result.not_blur;
                    const predictions = result.boxes?.predictions || [];

                    if (canvasRef.current && videoRef.current) {
                        drawOverlay(canvasRef.current, videoRef.current, predictions, consecutiveDetectionsRef.current >= 15);
                    }

                    // 1. Check for blur
                    if (isNotBlur === false) {
                        onFeedback("Image is blurry");
                        consecutiveDetectionsRef.current = 0;
                        return;
                    }

                    // 2. Check for detections
                    if (predictions.length === 0) {
                        onFeedback("ID not detected");
                        consecutiveDetectionsRef.current = 0;
                        lastBoxRef.current = null;
                        return;
                    }

                    const pred = predictions[0];

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
                        if (dx > 10 || dy > 10) {
                            isMoving = true;
                        }
                    }
                    lastBoxRef.current = pred;

                    if (isMoving) {
                        onFeedback("Hold still...");
                        consecutiveDetectionsRef.current = 0;
                    } else {
                        consecutiveDetectionsRef.current += 1;
                        onFeedback("Hold still...");
                    }

                    if (consecutiveDetectionsRef.current >= 15) {
                        onFeedback("Image successfully captured");
                        onStable();
                    }
                }
            });
            connectionRef.current = connection;

        } catch (error) {
            console.error("Failed to init Roboflow:", error);
            toast.error("Failed to start camera or inference");
        }
    }, [isDetecting, workspaceName, workflowId, onStable, onFeedback, videoRef, canvasRef, side]);

    useEffect(() => {
        if (isDetecting) {
            initRoboflow();
        }
        return () => {
            cleanup();
        };
    }, [isDetecting, initRoboflow, cleanup]);

    return { cleanup };
}
