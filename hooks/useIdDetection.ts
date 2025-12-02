import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { connectors, webrtc } from '@roboflow/inference-sdk';
import toast from "react-hot-toast";

export function useIdDetection(sessionId: string, side: "front" | "back") {
    const webcamRef = useRef<Webcam>(null);
    const [isDetecting, setIsDetecting] = useState(true);
    const [feedback, setFeedback] = useState(`Move your ${side} ID into View`);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const successCountRef = useRef(0);
    const connectionRef = useRef<any>(null);

    const handleData = useCallback((data: any) => {
        if (!isDetecting) return;

        // Check if we have any predictions
        // The structure depends on your specific workflow, but usually 'predictions' or similar output name
        // We'll assume the workflow returns a list of detections in the 'predictions' output
        const predictions = data.predictions || [];

        // Simple logic: if we see *something* with high confidence, we count it as success
        // You can refine this to check for specific classes like "id_card"
        const hasTarget = predictions.length > 0;

        if (hasTarget) {
            successCountRef.current += 1;
            setFeedback(`Hold steady... ${successCountRef.current}/10`);

            if (successCountRef.current >= 10) {
                capture();
            }
        } else {
            // Reset if we lose the target
            if (successCountRef.current > 0) {
                successCountRef.current = 0;
                setFeedback(`Move your ${side} ID into View`);
            }
        }
    }, [isDetecting, side]);

    const capture = useCallback(() => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsDetecting(false);
        setFeedback("Processing...");

        // Stop the Roboflow connection
        if (connectionRef.current) {
            connectionRef.current.cleanup();
            connectionRef.current = null;
        }

        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const fileName = `id-${side}.jpg`;
                const file = new File([blob], fileName, { type: "image/jpeg" });
                setCapturedFile(file);
                setPreviewUrl(URL.createObjectURL(blob));
                toast.success("ID Captured Successfully!");
            });
    }, [side]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let interval: NodeJS.Timeout;

        const initRoboflow = async () => {
            if (!webcamRef.current || !webcamRef.current.video || !webcamRef.current.video.srcObject) {
                return;
            }

            if (connectionRef.current) return; // Already connected

            stream = webcamRef.current.video.srcObject as MediaStream;

            const workspace = process.env.NEXT_PUBLIC_ROBOFLOW_WORKSPACE;
            const workflowId = process.env.NEXT_PUBLIC_ROBOFLOW_WORKFLOW_ID;

            if (!workspace || !workflowId) {
                console.error("Missing Roboflow config");
                toast.error("Missing Roboflow configuration");
                return;
            }

            try {
                // Use the backend proxy for authentication
                const connector = connectors.withProxyUrl("/api/roboflow-proxy");

                const connection = await webrtc.useStream({
                    source: stream,
                    connector,
                    wrtcParams: {
                        workspaceName: workspace,
                        workflowId: workflowId,
                        imageInputName: "image",
                        streamOutputNames: ["output"], // Adjust based on your workflow
                        dataOutputNames: ["predictions"], // Adjust based on your workflow
                    },
                    onData: (data) => {
                        handleData(data);
                    }
                });
                connectionRef.current = connection;
            } catch (error) {
                console.error("Failed to initialize Roboflow:", error);
                // toast.error("Failed to connect to detection service");
            }
        };

        // Poll for the stream to be ready
        interval = setInterval(() => {
            if (isDetecting && !connectionRef.current) {
                initRoboflow();
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (connectionRef.current) {
                connectionRef.current.cleanup();
                connectionRef.current = null;
            }
        };
    }, [isDetecting, handleData]);

    const resetDetection = () => {
        setCapturedFile(null);
        setPreviewUrl(null);
        setFeedback(`Move your ${side} ID into View`);
        successCountRef.current = 0;
        setIsDetecting(true);
    };

    return {
        webcamRef,
        feedback,
        capturedFile,
        previewUrl,
        resetDetection,
    };
}
