"use client";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SuccessPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verification Successful
                </h1>

                <p className="text-gray-500 mb-8">
                    Your identity has been successfully verified. You can now return to your desktop.
                </p>

                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    You can close this window now.
                </div>
            </motion.div>
        </div>
    );
}
