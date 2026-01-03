"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams} from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { IntroStep } from "@/components/mobile/IntroStep";
import { ScanIdStep } from "@/components/mobile/ScanIdStep";
import { ScanSelfieStep } from "@/components/mobile/ScanSelfieStep";
import { Files, Step } from "@/types";
import { supabase } from "@/lib/supabase";

export default function MobileCapture() {
    const params = useParams();
    const sessionId = params.id as string;
    const searchParams = useSearchParams();
    const profileId = searchParams.get('id');
    const [step, setStep] = useState<Step>("intro-id-front");
    const [files, setFiles] = useState<Files>({});
    const [progress, setProgress] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const fetchSessionStatus = async () => {

            try {
                const { data } = await supabase.from("verification_sessions").select("status").eq("id", sessionId).single();
                if (data && data.status === "success") {
                    router.push("/kyc/success");
                } else if (data && data.status === "failed") {
                    router.push("/kyc/failed");
                } else if (data && data.status === "processing") {
                    router.push("/kyc/processing");
                }
            } catch (error) {
                console.error("Error fetching session status:", error);
            }
        };
        fetchSessionStatus();
    }, [router, sessionId]);

    const handleIdCaptured = (file: File) => {
        if (step === "scan-id-front") {
            setFiles(prev => ({ ...prev, idFront: file }));
            setStep("intro-id-back");
        } else if (step === "scan-id-back") {
            setFiles(prev => ({ ...prev, idBack: file }));
            setStep("intro-selfie");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background justify-center items-center p-4">
            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white p-12 rounded-3xl shadow-lg text-center max-w-lg w-full border border-gray-200">

                {/* Progress Bar */}
                <div className="w-full p-4 mb-4">
                    <Progress value={progress} className="h-2" />
                </div>

                {step === "intro-id-front" && (
                    <IntroStep onNext={() => {
                        setStep("scan-id-front");
                        setProgress(25);
                    }} title="Get ready to scan your ID" description="You must scan your driver&apos;s license, passport or government-issued photo ID" icon="id" />
                )}

                {step === "scan-id-front" && (
                    <ScanIdStep onCapture={handleIdCaptured} side="front" />
                )}

                {step === "intro-id-back" && (
                    <IntroStep onNext={() => {
                        setStep("scan-id-back");
                        setProgress(50);
                    }} title="Flip your ID over" description="You must scan the back of your identity card" icon="id" />
                )}

                {step === "scan-id-back" && (
                    <ScanIdStep onCapture={handleIdCaptured} side="back" />
                )}

                {step === "intro-selfie" && (
                    <IntroStep onNext={() => {
                        setStep("scan-selfie");
                        setProgress(75);
                    }} title="Get ready to take a selfie" description="Take a live selfie images to compare to the image on your photo ID" icon="selfie" />
                )}

                {step === "scan-selfie" && (
                    <ScanSelfieStep sessionId={sessionId} files={files} profileId={profileId as string}/>
                )}
            </motion.div>
        </div>
    );
}