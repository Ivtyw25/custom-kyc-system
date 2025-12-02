import { supabase } from "@/lib/supabase";

export type SessionStatus = "waiting" | "processing" | "success" | "failed";

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
    try {
        const { error } = await fetch("/api/verification-session/status", {
            method: "POST",
            body: JSON.stringify({ sessionId, status }),
        }).then(res => res.json());

        if (error) throw new Error(error);
        return true;
    } catch (error) {
        console.error("Failed to update session status:", error);
        throw error;
    }
}

export async function getSessionStatus(sessionId: string): Promise<SessionStatus | null> {
    try {
        const { data, error } = await supabase
            .from("verification_sessions")
            .select("status")
            .eq("id", sessionId)
            .single();

        if (error) throw error;
        return data?.status as SessionStatus;
    } catch (error) {
        console.error("Error fetching session status:", error);
        return null;
    }
}
