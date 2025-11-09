import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import InteractiveMap from './InteractiveMap';
import { CloseIcon, AlertIcon, SparklesIcon } from './Icons';
import Button from './common/Button';
import IconButton from './common/IconButton';
import ToggleSwitch from './ToggleSwitch';

const AnalysisModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    result: string | null;
    error: string | null;
}> = ({ isOpen, onClose, result, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Soil Moisture Analysis</h3>
                    <IconButton variant="subtle" size="sm" onClick={onClose} aria-label="Close modal">
                        <CloseIcon className="w-6 h-6" />
                    </IconButton>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {error ? (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                            <AlertIcon className="w-8 h-8 mr-3 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Analysis Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 whitespace-pre-wrap">
                            {result || "No result data."}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl text-right">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface FarmMapProps {
    location: { lat: number; lon: number } | null;
    farmGeoData: any;
}

const FarmMap: React.FC<FarmMapProps> = ({ location, farmGeoData }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNdviVisible, setIsNdviVisible] = useState(true);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setAnalysisError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const simplifiedSoilData = farmGeoData.features.map((f: any) => ({
                name: f.properties.name,
                moisture: f.properties.soil_moisture,
            }));

            const prompt = `Act as an expert agronomist. Analyze the provided soil moisture data for several farm plots.
The data contains a list of plots with moisture levels: "Dry", "Optimal", and "Wet".
Provide a concise analysis for the farmer.
First, give a 1-2 sentence summary of the overall soil moisture situation based on the provided data.
Then, identify specific concerns, highlighting potential issues like drought stress in 'Dry' zones or root rot/waterlogging in 'Wet' zones by referencing the plot names.
Finally, provide a bulleted list of 2-3 immediate, actionable recommendations using '*' for each bullet point.
Keep the language simple and direct.

Soil Moisture Data: ${JSON.stringify(simplifiedSoilData)}`;
            
            const response = await ai.models.generateContent({ 
                model: "gemini-2.5-flash", 
                contents: prompt 
            });

            setAnalysisResult(response.text);

        } catch (err) {
            console.error("Analysis failed:", err);
            setAnalysisError("An AI error occurred. Please check your connection and try again.");
        } finally {
            setIsAnalyzing(false);
            setIsModalOpen(true);
        }
    };


    return (
        <>
            <AnalysisModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                result={analysisResult}
                error={analysisError}
            />
            <div className="relative h-full w-full">
                <InteractiveMap 
                    location={location}
                    isNdviVisible={isNdviVisible}
                    farmGeoData={farmGeoData}
                />
                
                {/* Overlay Controls */}
                 <div className="absolute bottom-20 sm:bottom-32 right-4 z-[1000] flex flex-col items-end gap-3">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20">
                        <ToggleSwitch 
                            id="ndvi-toggle" 
                            label="NDVI Overlay" 
                            enabled={isNdviVisible} 
                            setEnabled={setIsNdviVisible} 
                        />
                    </div>
                    <Button 
                        variant="primary" 
                        size="md" 
                        className="!rounded-full !py-3 !px-5 shadow-lg flex items-center"
                        onClick={handleAnalysis}
                        isLoading={isAnalyzing}
                        disabled={isAnalyzing}
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        <span>Analyze Soil</span>
                    </Button>
                </div>
            </div>
        </>
    );
};

export default FarmMap;
