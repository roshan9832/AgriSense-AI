

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import InteractiveMap from './InteractiveMap';
import { CloseIcon, AlertIcon, SparklesIcon, PlayIcon, PauseIcon } from './Icons';
import Button from './common/Button';
import IconButton from './common/IconButton';

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

// Generates 6 months of historical data leading up to the latest data point.
const generateHistoricalData = (latestData: any, months: number = 6) => {
    const history = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        
        const newFeatures = latestData.features.map((feature: any) => {
            const finalNdvi = feature.properties.ndvi;
            // Simple growth curve simulation (peaks around month 4-5)
            const growthStage = (months - 1 - i) / (months - 1); // 0 to 1
            const ndvi = finalNdvi * (Math.sin(growthStage * Math.PI) * 0.8 + 0.2) + (Math.random() - 0.5) * 0.05;
            
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    ndvi: Math.max(0.1, Math.min(0.99, parseFloat(ndvi.toFixed(2))))
                }
            };
        });

        history.push({
            date: date,
            geoData: { ...latestData, features: newFeatures }
        });
    }

    return history;
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

    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [timeIndex, setTimeIndex] = useState(5);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (farmGeoData?.features?.length > 0) {
            const history = generateHistoricalData(farmGeoData, 6);
            setHistoricalData(history);
            setTimeIndex(history.length - 1);
        }
    }, [farmGeoData]);

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            intervalRef.current = window.setInterval(() => {
                setTimeIndex(prevIndex => {
                    const nextIndex = prevIndex + 1;
                    if (nextIndex >= historicalData.length) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setIsPlaying(false);
                        return prevIndex;
                    }
                    return nextIndex;
                });
            }, 1000);
        }
    }, [isPlaying, historicalData.length]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

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

    const currentGeoData = historicalData[timeIndex]?.geoData;
    const currentDate = historicalData[timeIndex]?.date;

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
                    farmGeoData={currentGeoData}
                />
                
                <div className="absolute bottom-20 sm:bottom-32 right-4 z-[1000] flex flex-col items-end gap-3">
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
                
                {historicalData.length > 0 && (
                     <div className="time-lapse-control">
                        <div className="flex items-center gap-4">
                            <IconButton variant="subtle" size="sm" onClick={handlePlayPause}>
                                {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                            </IconButton>
                            <div className="flex-grow">
                                <input
                                    type="range"
                                    min="0"
                                    max={historicalData.length - 1}
                                    value={timeIndex}
                                    onChange={(e) => setTimeIndex(Number(e.target.value))}
                                    className="custom-slider w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>{historicalData[0].date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                    <span>{historicalData[historicalData.length - 1].date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="w-24 text-center">
                                <p className="font-bold text-gray-800 dark:text-gray-100">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FarmMap;