import React, { useRef, useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { LeafIcon, UploadIcon, InfoIcon, AlertIcon, RefreshIcon, CameraIcon, ImageIcon } from './Icons';
import Button from './common/Button';

interface AnalysisResult {
    is_healthy: boolean;
    issue_name: string | null;
    description: string;
    recommendations: string[];
}

const ResultCard: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const isHealthy = result.is_healthy;
    const statusText = isHealthy ? 'Analysis Complete: Healthy' : 'Analysis Complete: Issue Detected';
    const StatusIcon = isHealthy ? LeafIcon : AlertIcon;
    const statusColor = isHealthy ? 'text-green-500' : 'text-yellow-500';

    return (
        <div className="mt-4 space-y-4">
            <div className={`flex items-center p-3 rounded-lg ${isHealthy ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-800/20'}`}>
                <StatusIcon className={`w-8 h-8 mr-3 flex-shrink-0 ${statusColor}`} />
                <div>
                    <h3 className={`font-bold text-lg ${isHealthy ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>{statusText}</h3>
                    {!isHealthy && <p className="font-semibold text-gray-700 dark:text-gray-300">{result.issue_name}</p>}
                </div>
            </div>
            
            <div className="text-left space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{result.description}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Recommendations</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {result.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const CropHealth: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTriggerFileInput = (capture: boolean) => {
        if(fileInputRef.current) {
            if(capture) {
                fileInputRef.current.setAttribute('capture', 'environment');
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.click();
        }
    };

    const handleClear = () => {
        setUploadedImage(null);
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const analyzeImage = async (base64Data: string, mimeType: string) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = "Analyze this crop leaf image for diseases or nutrient deficiencies. Be concise. Provide the analysis in JSON format. The JSON must include: `is_healthy` (boolean), `issue_name` (string, e.g., 'Nitrogen Deficiency' or 'Powdery Mildew', must be null if healthy), `description` (string, a brief one-sentence summary), and `recommendations` (an array of 2-3 short, actionable recommendations for the farmer).";
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] },
                config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        is_healthy: { type: Type.BOOLEAN },
                        issue_name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["is_healthy", "issue_name", "description", "recommendations"]
                  }
                },
            });

            const parsedResult = JSON.parse(response.text);
            setAnalysisResult(parsedResult);
        } catch (err: any) {
            setError("Failed to analyze the image. The AI model may not be able to process this image. Please try a clearer picture or a different one.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setUploadedImage(base64String);

                const [header, data] = base64String.split(',');
                 if (!header || !data) {
                    setError("Invalid file format.");
                    return;
                }
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) {
                    setError("Could not determine file type.");
                    return;
                }
                const mimeType = mimeTypeMatch[1];
                analyzeImage(data, mimeType);
            };
            reader.onerror = () => {
                setError("Failed to read the file.");
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <div className="p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                aria-hidden="true"
                onChange={handleFileChange}
            />

            {!uploadedImage ? (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
                        <LeafIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Instant Crop Health Analysis</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">Take a photo or upload an image of a crop leaf to identify diseases and get recommendations.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => handleTriggerFileInput(true)} variant="primary" size="lg" className="w-full sm:w-auto">
                                <CameraIcon className="w-5 h-5 mr-2" />
                                Take Photo
                            </Button>
                             <Button onClick={() => handleTriggerFileInput(false)} variant="secondary" size="lg" className="w-full sm:w-auto">
                                <ImageIcon className="w-5 h-5 mr-2" />
                                Choose from Gallery
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg mb-4 flex items-center text-gray-800 dark:text-gray-100">
                           <InfoIcon className="w-5 h-5 text-blue-500 mr-2" />
                            How It Works
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Take a clear, well-lit photo of the affected leaf against a plain background for the best results. Our AI will analyze the image to detect signs of disease or nutrient deficiencies.
                        </p>
                        <div className="flex justify-around items-center space-x-2 sm:space-x-4">
                            <div className="text-center">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-green-400 dark:border-green-500 p-1 mx-auto">
                                    <img src="https://images.unsplash.com/photo-1598164074852-36b063126f64?q=80&w=200&auto=format&fit=crop" alt="Healthy leaf sample" className="rounded-full w-full h-full object-cover" />
                                </div>
                                <p className="text-xs font-semibold mt-2 text-green-700 dark:text-green-300">Healthy</p>
                            </div>
                             <div className="text-center">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-red-400 dark:border-red-500 p-1 mx-auto">
                                    <img src="https://images.unsplash.com/photo-1621043239339-3c355553e150?q=80&w=200&auto=format&fit=crop" alt="Diseased leaf sample" className="rounded-full w-full h-full object-cover" />
                                </div>
                                <p className="text-xs font-semibold mt-2 text-red-700 dark:text-red-300">Diseased</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Analysis Results</h2>
                    <div className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden shadow-lg">
                        <img src={uploadedImage} alt="Uploaded crop leaf" className="w-full h-auto object-cover" />
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="font-semibold">Analyzing...</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 text-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                            <p className="font-bold">Analysis Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {analysisResult && <ResultCard result={analysisResult} />}

                    <Button onClick={handleClear} variant="secondary" size="lg" className="w-full sm:w-auto mt-6">
                        <RefreshIcon className="w-5 h-5 mr-2" />
                        Analyze Another Image
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CropHealth;