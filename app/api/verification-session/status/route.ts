import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { sessionId, status } = await req.json();

        if (!sessionId || !status) {
            return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
        }

        const { error } = await supabase
            .from('verification_sessions')
            .update({ status })
            .eq('id', sessionId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating session status:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
