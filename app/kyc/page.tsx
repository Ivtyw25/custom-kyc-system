"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DesktopKYC() {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const profileId = searchParams.get('id')
    const router = useRouter();

    const startVerification = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("verification_sessions").insert({'profileId': profileId}).select().single();
            if (error) throw error;
            if (data && data.id)
                router.push(`/kyc/${data.id}?id=${profileId}`);
        } catch (err) {
            console.error("Error creating session:", err);
            alert("Failed to start verification. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white p-12 rounded-3xl shadow-lg text-center max-w-lg w-full border border-gray-200"
            >
                <h1 className="text-4xl font-bold mb-8 text-foreground">Verification</h1>

                <p className="text-primary font-medium text-lg mb-12">
                    Verify your identity to sell your available property
                </p>

                <button
                    onClick={startVerification}
                    disabled={loading}
                    className="theme-btn text-lg py-4 shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                    {loading ? (
                        <motion.span
                            animate={{
                                x: [0, -4, 4, -4, 0],
                                y: [0, -1, 0, -1, 0]
                            }}
                            transition={{
                                duration: 0.45,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            Starting...
                        </motion.span>
                    ) : (
                        "Start Verification"
                    )}
                </button>
            </motion.div>
        </div>
    );
}