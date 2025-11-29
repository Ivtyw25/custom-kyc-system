import { IdCard, ScanFace } from "lucide-react";
import { motion } from "framer-motion";
import { IntroStepProps } from "@/types";

export function IntroStep({ onNext, title, description, icon = "id" }: IntroStepProps) {
    return (
        <div className="space-y-8 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-3xl font-bold text-gray-900">
                {title}
            </h1>

            <p className="text-gray-600 text-lg">
                {description}
            </p>

            <div className="py-12 flex justify-center">
                <motion.div
                    className="relative"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {icon === "id" ? (
                        <IdCard className="w-32 h-32 text-black stroke-1" />
                    ) : (
                        <ScanFace className="w-32 h-32 text-black stroke-1" />
                    )}
                </motion.div>
            </div>

            <button
                onClick={onNext}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-lg transition-all active:scale-95"
            >
                I&apos;m ready
            </button>
        </div>
    );
}
