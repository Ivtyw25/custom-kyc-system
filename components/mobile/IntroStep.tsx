import { IdCard } from "lucide-react";

interface IntroStepProps {
    onNext: () => void;
}

export function IntroStep({ onNext }: IntroStepProps) {
    return (
        <div className="space-y-8 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-3xl font-bold text-gray-900">
                Get ready to scan your ID
            </h1>

            <p className="text-gray-600 text-lg">
                You must scan your driver's license, passport or government-issued photo ID
            </p>

            <div className="py-12 flex justify-center">
                <div className="relative">
                    <IdCard className="w-32 h-32 text-black stroke-1" />
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-lg transition-all active:scale-95"
            >
                I'm ready
            </button>
        </div>
    );
}
