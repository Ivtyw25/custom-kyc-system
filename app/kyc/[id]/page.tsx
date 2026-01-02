"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@lib/constants";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle } from "lucide-react";

export default function SessionPage() {
    const { id: sessionId } = useParams();
    const router = useRouter();
    const [status, setStatus] = useState("waiting"); // waiting, processing, success, failed

    useEffect(() => {
        if (!sessionId) return;

        const channel = supabase
            .channel(`session-status-change`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "verification_sessions", filter: `id=eq.${sessionId}` },
                (payload) => {
                    setStatus(payload.new.status);
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    const mobileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/kyc/mobile/${sessionId}`;
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white p-10 rounded-3xl shadow-lg text-center max-w-md w-full border border-gray-200"
            >
                {status === "waiting" && (
                    <>
                        <motion.h1 variants={itemVariants} className="text-2xl font-bold mb-4 text-foreground">
                            Continue on your mobile device
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-primary font-medium mb-8">
                            Scan the QR code to use the camera on your mobile device
                        </motion.p>

                        <motion.div variants={itemVariants} className="bg-white p-2 border border-dashed inline-block rounded-xl mb-8">
                            <QRCode value={mobileUrl} size={200} />
                        </motion.div>

                        <motion.div variants={itemVariants} className="mt-4">
                            <button className="text-gray-400 text-sm hover:text-gray-600 underline">
                                other options
                            </button>
                        </motion.div>
                    </>
                )}

                {status === "processing" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-10"
                    >
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h2 className="text-primary text-xl font-bold animate-pulse">Verifying Identity...</h2>
                    </motion.div>
                )}

                {status === "success" && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-green-600 py-10"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Verified!</h2>
                        <p className="text-gray-500">You may now proceed.</p>
                    </motion.div>
                )}

                {status === "failed" && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-red-500 py-10"
                    >
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-8">
                            We couldn&apos;t verify your identity.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => router.push("/kyc")}
                                className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl shadow-lg hover:bg-orange-600 transition-all active:scale-95"
                            >
                                Start New Verification
                            </button>
                            <p className="text-sm text-gray-400">
                                If you don&apos;t wish to retry, you can close this page.
                            </p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
