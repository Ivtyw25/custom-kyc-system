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
export async function updateSessionOCRData(sessionId: string, ocrData: any) {
    try {
        const { error } = await supabase
            .from("verification_sessions")
            .update({
                nric_number: ocrData.nricNumber,
                nric_back: ocrData.back?.nricNumber,
                name: ocrData.name,
                address: ocrData.address,
                gender: ocrData.gender
            })
            .eq("id", sessionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Failed to update session OCR data:", error);
        throw error;
    }
}

export async function compareOcrResult(ocrData: any, profileId: string | null) {
    if (!profileId || profileId === 'null') {
        console.error("Invalid profileId provided to compareOcrResult:", profileId);
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('profile_id', profileId)
            .single();

        if (error) throw error;

        if (data) {
            const targetName = ocrData.name.toLowerCase();
            if (data.name.toLowerCase() === targetName)
                return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to get the profiles data:", error);
        throw error;
    }
}
