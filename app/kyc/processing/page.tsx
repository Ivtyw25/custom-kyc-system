"use client";
import { Loader2 } from "lucide-react";

export default function ProcessingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verification in Progress
                </h1>

                <p className="text-gray-500 mb-8">
                    We are currently verifying your identity. This may take a few moments.
                </p>

                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    Please do not close this window.
                </div>
            </div>
        </div>
    );
}
