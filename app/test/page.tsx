"use client";
import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, ScanFace, X, Check, AlertCircle } from 'lucide-react';

export default function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Reset the app state
    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Upload to the API
    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            // NOTE: Ensure this path matches your Next.js API route location
            const response = await fetch('/api/test-face-detection', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze image');
            }

            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong connecting to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get the top emotion
    const getTopEmotion = (emotions: any[]) => {
        if (!emotions || emotions.length === 0) return 'Unknown';
        return emotions.reduce((prev, current) =>
            (prev.Confidence > current.Confidence) ? prev : current
        ).Type;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 font-sans selection:bg-indigo-100">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="text-center space-y-2 pt-8">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
                        <ScanFace className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Face Rekognition
                    </h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Upload a photo to detect faces, analyze emotions, and estimate age ranges using AWS.
                    </p>
                </header>

                {/* Main Interface */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                    <div className="grid md:grid-cols-2 gap-0">

                        {/* Left Column: Image Area */}
                        <div className="relative bg-slate-100 min-h-[400px] flex items-center justify-center p-6 border-r border-slate-100">

                            {!previewUrl ? (
                                // Empty State
                                <div
                                    onClick={triggerFileInput}
                                    className="w-full h-80 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-all group bg-slate-50/50"
                                >
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="font-medium">Click to upload photo</p>
                                    <p className="text-sm opacity-70">JPG or PNG supported</p>
                                </div>
                            ) : (
                                // Image Preview with Bounding Boxes
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="relative inline-block shadow-lg rounded-lg overflow-hidden max-h-[600px]">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-full h-auto object-contain block"
                                        />

                                        {/* Bounding Boxes Overlay */}
                                        {result?.faces?.map((face: any, index: number) => {
                                            const box = face.BoundingBox;
                                            return (
                                                <div
                                                    key={index}
                                                    className="absolute border-2 border-indigo-500 bg-indigo-500/20 z-10 hover:bg-indigo-500/40 transition-colors cursor-help"
                                                    style={{
                                                        top: `${box.Top * 100}%`,
                                                        left: `${box.Left * 100}%`,
                                                        width: `${box.Width * 100}%`,
                                                        height: `${box.Height * 100}%`,
                                                    }}
                                                    title={`Face #${index + 1}`}
                                                >
                                                    <span className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleReset}
                                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-md rounded-full text-slate-600 hover:text-red-600 transition-colors z-20"
                                        title="Remove image"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {/* Right Column: Controls & Results */}
                        <div className="p-8 flex flex-col h-full bg-white">

                            {/* Action Area */}
                            {!result && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-800">Analyzing...</h3>
                                            <p className="text-slate-500 text-sm">Sending to AWS Rekognition</p>
                                        </div>
                                    ) : error ? (
                                        <div className="p-6 bg-red-50 rounded-xl text-red-600 space-y-2">
                                            <div className="flex justify-center mb-2"><AlertCircle className="w-8 h-8" /></div>
                                            <p className="font-medium">Error Processing Image</p>
                                            <p className="text-sm opacity-80">{error}</p>
                                            <button onClick={() => setError(null)} className="text-xs underline mt-2">Try again</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-slate-800">Ready to Scan</h3>
                                                <p className="text-slate-500 text-sm">
                                                    {selectedFile
                                                        ? "Image selected. Click below to start analysis."
                                                        : "Upload an image to get detailed facial insights."}
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleUpload}
                                                disabled={!selectedFile}
                                                className={`
                          w-full py-3 px-6 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2
                          ${selectedFile
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                        `}
                                            >
                                                <Camera className="w-5 h-5" />
                                                Detect Faces
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Results Area */}
                            {result && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-500" />
                                            Analysis Results
                                        </h3>
                                        <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                            {result.faces?.length || 0} Faces Detected
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px] custom-scrollbar">
                                        {result.faces?.length === 0 ? (
                                            <div className="text-center text-slate-500 py-10">
                                                No faces were detected in this image.
                                            </div>
                                        ) : (
                                            result.faces.map((face: any, i: number) => (
                                                <div key={i} className="group p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                                            Face #{i + 1}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            Confidence: {face.Confidence?.toFixed(1)}%
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        {/* Age */}
                                                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="block text-xs text-slate-400 uppercase font-semibold">Age Range</span>
                                                            <span className="font-medium text-slate-800">
                                                                {face.AgeRange?.Low} - {face.AgeRange?.High} years
                                                            </span>
                                                        </div>

                                                        {/* Gender */}
                                                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="block text-xs text-slate-400 uppercase font-semibold">Gender</span>
                                                            <span className="font-medium text-slate-800">
                                                                {face.Gender?.Value}
                                                            </span>
                                                        </div>

                                                        {/* Emotion */}
                                                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm col-span-2">
                                                            <span className="block text-xs text-slate-400 uppercase font-semibold">Primary Emotion</span>
                                                            <span className="font-medium text-indigo-600 capitalize">
                                                                {getTopEmotion(face.Emotions).toLowerCase()}
                                                            </span>
                                                        </div>

                                                        {/* Quality: Sharpness & Brightness */}
                                                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="block text-xs text-slate-400 uppercase font-semibold">Sharpness</span>
                                                            <span className="font-medium text-slate-800">
                                                                {face.Quality?.Sharpness?.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="block text-xs text-slate-400 uppercase font-semibold">Brightness</span>
                                                            <span className="font-medium text-slate-800">
                                                                {face.Quality?.Brightness?.toFixed(1)}%
                                                            </span>
                                                        </div>

                                                        {/* Boolean Attributes */}
                                                        <div className="col-span-2 flex flex-wrap gap-2 mt-1">
                                                            {face.Smile?.Value && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">Smiling</span>
                                                            )}
                                                            {face.Eyeglasses?.Value && (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">Glasses</span>
                                                            )}
                                                            {face.Sunglasses?.Value && (
                                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-md font-medium">Sunglasses</span>
                                                            )}
                                                            {face.Beard?.Value && (
                                                                <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-md font-medium">Beard</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button
                                        onClick={handleReset}
                                        className="mt-6 w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        Analyze Another Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}