"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; // Your supabase setup
import QRCode from "react-qr-code";

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabase_url || !supabase_anon_key) {
    throw new Error("Missing Supabase configuration");
}

const supabase = createClient(supabase_url, supabase_anon_key);

export default function DesktopKYC() {
    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, waiting, processing, success, failed

    // 1. Create a session when page loads
    useEffect(() => {
        async function initSession() {
            const { data } = await supabase.from("verification_sessions").insert({}).select().single();
            setSessionId(data.id);
            setStatus("waiting");

            // 2. Listen for changes from the mobile device
            supabase
                .channel(`session-${data.id}`)
                .on("postgres_changes", { event: "UPDATE", schema: "public", table: "verification_sessions", filter: `id=eq.${data.id}` },
                    (payload) => {
                        setStatus(payload.new.status);
                    })
                .subscribe();
        }
        initSession();
    }, []);

    if (!sessionId) return <p>Loading secure session...</p>;

    // The mobile URL triggers the mobile flow
    const mobileUrl = `https://custom-kyc-system.vercel.app/kyc/mobile/${sessionId}`;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <div className="bg-white p-10 rounded-xl shadow-lg text-center">
                {status === "waiting" && (
                    <>
                        <h1 className="text-2xl font-bold mb-4">Scan to Verify</h1>
                        <div className="bg-white p-4 inline-block">
                            <QRCode value={mobileUrl} />
                        </div>
                        <p className="mt-4 text-gray-500">Please scan this with your mobile phone.</p>
                    </>
                )}

                {status === "processing" && <h2 className="text-blue-600 text-xl animate-pulse">Verifying Identity...</h2>}

                {status === "success" && (
                    <div className="text-green-600">
                        <h2 className="text-3xl font-bold">Verified! ✅</h2>
                        <p>You may now proceed.</p>
                    </div>
                )}

                {status === "failed" && (
                    <div className="text-red-600">
                        <h2 className="text-3xl font-bold">Verification Failed ❌</h2>
                        <p>Face did not match ID card.</p>
                    </div>
                )}
            </div>
        </div>
    );
}