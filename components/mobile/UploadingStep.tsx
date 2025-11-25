import { Loader2 } from "lucide-react";

export function UploadingStep() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
            <p className="text-lg font-medium text-gray-600">Verifying your identity...</p>
        </div>
    );
}
