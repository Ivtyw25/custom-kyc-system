import { CheckCircle } from "lucide-react";

export function CompleteStep() {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Submitted!</h2>
            <p className="text-gray-600">Please check your desktop screen.</p>
        </div>
    );
}
