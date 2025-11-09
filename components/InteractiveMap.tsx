

import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { GoogleGenAI } from "@google/genai";
import { WaterSourceIcon, WeatherStationIcon, CloseIcon, CrosshairsIcon, WeatherRainIcon, SparklesIcon, FlaskIcon } from './Icons';
import Button from './common/Button';
import IconButton from './common/IconButton';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet.fullscreen';
import 'leaflet-draw';


// Fix for default icon paths in Leaflet when used with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const soilMoistureData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Dry" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.509 ], [ -0.08, 51.509 ], [ -0.085, 51.505 ], [ -0.09, 51.505 ], [ -0.09, 51.509 ] ] ] }
        },
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Optimal" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.08, 51.512 ], [ -0.07, 51.513 ], [ -0.065, 51.51 ], [ -0.08, 51.509 ], [ -0.08, 51.512 ] ] ] }
        },
        {
            "type": "Feature",
            "properties": { "moistureLevel": "Wet" },
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.507 ], [ -0.06, 51.507 ], [ -0.06, 51.505 ], [ -0.07, 51.505 ], [ -0.07, 51.507 ] ] ] }
        }
    ]
};

const resources = {
    waterSource: { lat: 51.508, lng: -0.075 },
    weatherStation: { lat: 51.513, lng: -0.085 },
};

const getCropStyle = (crop: string) => {
    switch (crop) {
        case 'Wheat': return { color: '#fbbf24', fillColor: '#fde68a', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Corn': return { color: '#22c55e', fillColor: '#86efac', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Soybean': return { color: '#f97316', fillColor: '#fed7aa', weight: 2, opacity: 1, fillOpacity: 0.6 };
        case 'Vineyard': return { color: '#a855f7', fillColor: '#d8b4fe', weight: 2, opacity: 1, fillOpacity: 0.6 };
        default: return { color: '#6b7280', fillColor: '#d1d5db', weight: 2, opacity: 1, fillOpacity: 0.6 };
    }
};

const getNdviStyle = (ndvi: number) => {
    const color = ndvi > 0.8 ? '#15803d' : ndvi > 0.5 ? '#4d7c0f' : ndvi > 0.2 ? '#f59e0b' : '#dc2626';
    return { color: color, fillColor: color, weight: 2, opacity: 1, fillOpacity: 0.7 };
};

const getMoistureStyle = (level: string) => {
    switch (level) {
        case 'Dry': return { color: '#f59e0b', fillColor: '#fcd34d', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        case 'Optimal': return { color: '#16a34a', fillColor: '#4ade80', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        case 'Wet': return { color: '#0284c7', fillColor: '#38bdf8', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
        default: return { color: '#6b7280', fillColor: '#d1d5db', weight: 1, opacity: 0.8, fillOpacity: 0.5 };
    }
};

const getRainfallStyle = (feature: any) => {
    const intensity = feature.properties.intensity;
    const color = intensity > 40 ? '#08306b' : // Heavy
                  intensity > 20 ? '#08519c' :
                  intensity > 10 ? '#2171b5' :
                  intensity > 5 ? '#4292c6' :
                  intensity > 1 ? '#6baed6' : // Light
                  'transparent'; // Very light
    return {
        color: 'transparent',
        fillColor: color,
        weight: 0,
        fillOpacity: 0.5
    };
};


const createCustomIcon = (iconComponent: React.ReactElement) => {
    return L.divIcon({
        html: ReactDOMServer.renderToString(iconComponent),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const getNdviStatus = (ndvi: number) => {
    if (ndvi > 0.8) return { text: 'Very Healthy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (ndvi > 0.5) return { text: 'Healthy', color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/30' };
    if (ndvi > 0.2) return { text: 'Moderate Stress', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { text: 'High Stress', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
};

const getSoilMoistureStatus = (level: string) => {
    switch (level) {
        case 'Wet': return { text: 'Wet', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        case 'Optimal': return { text: 'Optimal', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
        case 'Dry': return { text: 'Dry', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
        default: return { text: 'Unknown', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
    }
};

const BottomSheet: React.FC<{ plot: any | null, onClose: () => void }> = ({ plot, onClose }) => {
    const ndviStatus = plot ? getNdviStatus(plot.ndvi) : null;
    const moistureStatus = plot ? getSoilMoistureStatus(plot.soil_moisture) : null;

    return (
        <div className={`absolute bottom-0 left-0 right-0 z-[1001] w-full max-w-xl mx-auto transform transition-transform duration-300 ease-in-out ${plot ? 'translate-y-0' : 'translate-y-full'}`}
             aria-hidden={!plot}
        >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-t-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">
                <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
                    <div className="bottom-sheet-handle"></div>
                </div>

                {plot && (
                    <>
                        <div className="flex justify-between items-center px-4 pt-0 pb-3">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{plot.name}</h3>
                            <IconButton variant="subtle" size="sm" onClick={onClose} aria-label="Close details">
                                <CloseIcon className="w-5 h-5" />
                            </IconButton>
                        </div>
                        <div className="px-4 pb-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Crop:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{plot.crop}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">NDVI Health:</span>
                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${ndviStatus.bg} ${ndviStatus.color}`}>
                                    {ndviStatus.text} ({plot.ndvi.toFixed(2)})
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Soil Moisture:</span>
                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${moistureStatus.bg} ${moistureStatus.color}`}>
                                    {moistureStatus.text}
                                </span>
                            </div>
                            {plot.soil_type && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Soil Type:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{plot.soil_type}</span>
                                </div>
                            )}
                            {plot.soil_ph && typeof plot.soil_ph === 'number' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                        <FlaskIcon className="w-4 h-4 mr-2 text-purple-500" />
                                        Soil pH:
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{plot.soil_ph.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <Button variant="secondary" size="sm" className="w-full">View Full Report</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const PointAnalysisSheet: React.FC<{ 
    analysis: { latlng: L.LatLng, result: string | null, error: string | null } | null, 
    isLoading: boolean,
    onClose: () => void 
}> = ({ analysis, isLoading, onClose }) => {
    
    return (
        <div className={`absolute bottom-0 left-0 right-0 z-[1001] w-full max-w-xl mx-auto transform transition-transform duration-300 ease-in-out ${analysis ? 'translate-y-0' : 'translate-y-full'}`}
             aria-hidden={!analysis}
        >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-t-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">
                <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
                    <div className="bottom-sheet-handle"></div>
                </div>

                {analysis && (
                    <>
                        <div className="flex justify-between items-center px-4 pt-0 pb-3">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                                <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                                AI Point Analysis
                            </h3>
                            <IconButton variant="subtle" size="sm" onClick={onClose} aria-label="Close details">
                                <CloseIcon className="w-5 h-5" />
                            </IconButton>
                        </div>
                        <div className="px-4 pb-4 space-y-3 min-h-[100px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Analyzing coordinates...</span>
                                </div>
                            ) : analysis.error ? (
                                <p className="text-red-600 dark:text-red-400 text-sm">{analysis.error}</p>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{analysis.result}</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


interface InteractiveMapProps {
    location: { lat: number, lon: number } | null;
    farmGeoData: any; // The dynamic farm data GeoJSON
    showControls?: boolean;
}

const MapLegend: React.FC<{
    showNdvi: boolean;
    showSoilMoisture: boolean;
    showRainfall: boolean;
}> = ({ showNdvi, showSoilMoisture, showRainfall }) => (
    <div className="absolute bottom-20 sm:bottom-4 left-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] w-56 text-xs transition-all duration-300">
        <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-1">Legend</h4>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showNdvi ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
             <p className="font-semibold text-gray-700 dark:text-gray-200">NDVI Health</p>
             <div className="w-full h-3 my-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 border border-gray-200 dark:border-gray-600"></div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400 text-[10px] px-1">
                 <span>Low (&lt;0.2)</span>
                 <span>Mid (~0.5)</span>
                 <span>High (&gt;0.8)</span>
             </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSoilMoisture ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <p className="font-semibold text-gray-700 dark:text-gray-200">Soil Moisture</p>
            <ul className="space-y-1 mt-1 text-gray-600 dark:text-gray-300">
                <li className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-sm bg-[#38bdf8] border border-gray-400/50 mr-2"></div>
                    <span>Wet</span>
                </li>
                <li className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-sm bg-[#4ade80] border border-gray-400/50 mr-2"></div>
                    <span>Optimal</span>
                </li>
                <li className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-sm bg-[#fcd34d] border border-gray-400/50 mr-2"></div>
                    <span>Dry</span>
                </li>
            </ul>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showRainfall ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
             <p className="font-semibold text-gray-700 dark:text-gray-200 flex items-center"><WeatherRainIcon className="w-4 h-4 mr-1 text-blue-500"/>7-Day Rainfall (mm)</p>
             <div className="w-full h-3 my-1 rounded-full bg-gradient-to-r from-[#6baed6] to-[#08306b] border border-gray-200 dark:border-gray-600"></div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400 text-[10px] px-1">
                 <span>Light (&lt;5)</span>
                 <span>Heavy (&gt;40)</span>
             </div>
        </div>
        
        <div className={`pt-2 transition-all duration-300 ease-in-out ${(showNdvi || showSoilMoisture || showRainfall) ? 'mt-2 border-t border-gray-300 dark:border-gray-600' : ''}`}>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Points of Interest</p>
            <ul className="space-y-1">
                <li className="flex items-center text-sm">
                    <WaterSourceIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">Water Source</span>
                </li>
                <li className="flex items-center text-sm">
                    <WeatherStationIcon className="w-4 h-4 mr-2 text-slate-600" />
                    <span className="text-gray-700 dark:text-gray-300">Weather Station</span>
                </li>
            </ul>
        </div>
    </div>
);

const generateRainfallData = (center: { lat: number, lon: number }) => {
    const features = [];
    const bounds = L.latLng(center.lat, center.lon).toBounds(10000); // 10km radius
    
    for (let i = 0; i < 25; i++) { // 25 random patches
        const intensity = Math.random() * 50; // 0-50mm
        const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
        const lon = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
        const size = 0.005 + Math.random() * 0.01;
        
        features.push({
            type: "Feature",
            properties: { intensity },
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [lon, lat],
                    [lon + size, lat],
                    [lon + size, lat + size],
                    [lon, lat + size],
                    [lon, lat],
                ]]
            }
        });
    }
    return { type: "FeatureCollection", features };
};


const InteractiveMap: React.FC<InteractiveMapProps> = ({ location, farmGeoData, showControls = true }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const userLocationMarkerRef = useRef<L.Marker | null>(null);
    const farmPlotsLayerRef = useRef<L.GeoJSON | null>(null);
    const rainfallLayerRef = useRef<L.GeoJSON | null>(null);
    const analysisMarkerRef = useRef<L.Marker | null>(null);

    const waterMarkerRef = useRef<L.Marker | null>(null);
    const stationMarkerRef = useRef<L.Marker | null>(null);
    
    const [isNdviVisible, setIsNdviVisible] = useState(true);
    const [isRainfallVisible, setIsRainfallVisible] = useState(true);
    const [showSoilMoisture, setShowSoilMoisture] = useState(false);
    const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
    const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);
    const [rainfallGeoJson, setRainfallGeoJson] = useState<any | null>(null);
    const [analysisPoint, setAnalysisPoint] = useState<any | null>(null);
    const [isPointAnalyzing, setIsPointAnalyzing] = useState(false);

    const [weatherData, setWeatherData] = useState({ temp: 32.1, wind: 15, humidity: 65 });
    const [waterData, setWaterData] = useState({ flow: 45, level: 89 });

    // Refs to hold current state for Leaflet control access
    const isNdviVisibleRef = useRef(isNdviVisible);
    const isRainfallVisibleRef = useRef(isRainfallVisible);
    useEffect(() => {
        isNdviVisibleRef.current = isNdviVisible;
        isRainfallVisibleRef.current = isRainfallVisible;
    }, [isNdviVisible, isRainfallVisible]);


    useEffect(() => {
        const intervalId = setInterval(() => {
            setWeatherData(prev => ({
                temp: parseFloat((prev.temp + (Math.random() - 0.5) * 0.5).toFixed(1)),
                wind: Math.max(0, Math.round(prev.wind + (Math.random() - 0.5) * 2)),
                humidity: Math.max(0, Math.min(100, Math.round(prev.humidity + (Math.random() - 0.5) * 2))),
            }));
            setWaterData(prev => ({
                flow: Math.max(0, Math.round(prev.flow + (Math.random() - 0.5) * 3)),
                level: Math.max(0, Math.min(100, Math.round(prev.level + (Math.random() - 0.4) * 1))),
            }));
        }, 3000); // Update every 3 seconds

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const stationPopupContent = `
            <div>
                <h4 style="font-weight: bold; margin-bottom: 5px;">Weather Station</h4>
                <p><strong>Temp:</strong> ${weatherData.temp}°C</p>
                <p><strong>Wind:</strong> ${weatherData.wind} km/h</p>
                <p><strong>Humidity:</strong> ${weatherData.humidity}%</p>
                <p style="font-size: 0.8em; color: gray; margin-top: 5px;">Live Data Feed</p>
            </div>
        `;
        if (stationMarkerRef.current) {
            stationMarkerRef.current.setPopupContent(stationPopupContent);
        }

        const waterPopupContent = `
            <div>
                <h4 style="font-weight: bold; margin-bottom: 5px;">Water Source</h4>
                <p><strong>Flow Rate:</strong> ${waterData.flow} L/s</p>
                <p><strong>Reservoir Level:</strong> ${waterData.level}%</p>
                <p style="font-size: 0.8em; color: gray; margin-top: 5px;">Live Data Feed</p>
            </div>
        `;
        if (waterMarkerRef.current) {
            waterMarkerRef.current.setPopupContent(waterPopupContent);
        }
    }, [weatherData, waterData]);


    const handlePointAnalysis = async (latlng: L.LatLng) => {
        setIsPointAnalyzing(true);
        setAnalysisPoint({ latlng, result: null, error: null });

        if (analysisMarkerRef.current) {
            analysisMarkerRef.current.setLatLng(latlng);
        } else {
            const pulsingIcon = L.divIcon({
                className: 'point-analysis-marker',
                html: `<div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });
            analysisMarkerRef.current = L.marker(latlng, { icon: pulsingIcon });
        }
        analysisMarkerRef.current?.addTo(mapRef.current!);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Provide a concise agricultural analysis for the GPS coordinate: latitude ${latlng.lat.toFixed(5)}, longitude ${latlng.lng.toFixed(5)}. Focus on:
1.  **Potential Soil Type:** (e.g., Loamy, Sandy, Clayey) based on general regional data.
2.  **Crop Suitability:** Suggest 2-3 suitable crops for this likely soil type and climate.
3.  **Key Recommendation:** Provide one critical, actionable tip for this specific point (e.g., "Check for waterlogging if in a low-lying area," or "Ideal for shallow-root crops due to potential rockiness.").
Keep the entire response in a single paragraph under 60 words.`;

            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setAnalysisPoint({ latlng, result: response.text, error: null });
        } catch (error) {
            console.error("Point analysis failed:", error);
            setAnalysisPoint({ latlng, result: null, error: "Sorry, could not analyze this point. Please try again." });
        } finally {
            setIsPointAnalyzing(false);
        }
    };


    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                zoomControl: false,
                fullscreenControl: {
                    position: 'topright',
                    title: 'Full screen',
                    titleCancel: 'Exit full screen'
                }
            }).setView([51.505, -0.09], 13);
            mapRef.current = map;
            
            // Add Base Layers
            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, etc.'
            });

            // Add Farm Plots Layer (initially empty, will be populated by props)
            const farmPlotsLayer = L.geoJSON(undefined, {
                style: (feature) => getCropStyle(feature?.properties.crop),
                onEachFeature: (feature, layer) => {
                    layer.on('click', (e) => {
                        setSelectedPlot(feature.properties);
                        map.fitBounds(e.target.getBounds());
                        L.DomEvent.stopPropagation(e);
                    });
                }
            }).addTo(map);
            farmPlotsLayerRef.current = farmPlotsLayer;

            // Initialize Rainfall Layer
            rainfallLayerRef.current = L.geoJSON(undefined, { style: getRainfallStyle, interactive: false });
            
            // Define Overlay Layers
            const soilLayer = L.geoJSON(soilMoistureData as any, { style: (f) => getMoistureStyle(f?.properties.moistureLevel), interactive: false });

            // Add Markers
            const waterIcon = createCustomIcon(<div className="p-1 bg-white rounded-full shadow-lg"><WaterSourceIcon className="w-6 h-6 text-blue-500" /></div>);
            waterMarkerRef.current = L.marker([resources.waterSource.lat, resources.waterSource.lng], { icon: waterIcon }).addTo(map).bindPopup('Loading live data...');
            waterMarkerRef.current.on('click', (e) => map.setView(e.latlng, 16));

            const stationIcon = createCustomIcon(<div className="p-1 bg-white rounded-full shadow-lg"><WeatherStationIcon className="w-6 h-6 text-slate-600" /></div>);
            stationMarkerRef.current = L.marker([resources.weatherStation.lat, resources.weatherStation.lng], { icon: stationIcon }).addTo(map).bindPopup('Loading live data...');
            stationMarkerRef.current.on('click', (e) => map.setView(e.latlng, 16));

            // --- ADD MAP CONTROLS ---
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            L.control.scale({ position: 'bottomleft' }).addTo(map);
            
            const searchControl = new GeoSearchControl({
                provider: new OpenStreetMapProvider(),
                style: 'bar',
                searchLabel: 'Search address',
                showMarker: true,
                showPopup: false,
                autoClose: true,
                retainZoomLevel: false,
                animateZoom: true,
                keepResult: true,
            });
            map.addControl(searchControl);

            const baseMaps = { "Satellite": satelliteLayer, "Street": streetLayer };
            const overlayMaps = { "Soil Moisture": soilLayer };
            const layersControl = L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);
            satelliteLayer.addTo(map);
            
            const MyLocationControl = L.Control.extend({
                onAdd: (map: L.Map) => {
                    const btn = L.DomUtil.create('button', 'leaflet-control leaflet-control-custom leaflet-fab');
                    btn.innerHTML = ReactDOMServer.renderToString(<CrosshairsIcon className="w-6 h-6" />);
                    btn.title = "Go to my location";
                    L.DomEvent.on(btn, 'click', (e) => {
                        L.DomEvent.stop(e);
                        if (location) map.setView([location.lat, location.lon], 16);
                    });
                    return btn;
                },
            });
            map.addControl(new MyLocationControl({ position: 'bottomright' }));

             if (showControls) {
                const OverlayToggleControl = L.Control.extend({
                    onAdd: () => {
                        const container = L.DomUtil.create('div', 'leaflet-control bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20');
                        L.DomEvent.disableClickPropagation(container);
                        L.DomEvent.disableScrollPropagation(container);

                        const createToggle = (id: string, labelText: string, getterRef: React.MutableRefObject<boolean>, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
                            const wrapper = L.DomUtil.create('div', 'flex justify-between items-center w-full', container);
                            wrapper.style.minWidth = '160px';

                            const label = L.DomUtil.create('label', 'font-medium text-sm text-gray-700 dark:text-gray-200 mr-4 cursor-pointer', wrapper);
                            label.htmlFor = id;
                            label.innerText = labelText;
                            
                            const button = L.DomUtil.create('button', 'w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out', wrapper);
                            button.id = id;
                            button.role = 'switch';
                            
                            const knob = L.DomUtil.create('div', 'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out', button);

                            const updateUI = (enabled: boolean) => {
                                button.setAttribute('aria-checked', String(enabled));
                                if (enabled) {
                                    button.className = 'w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out bg-green-500';
                                    knob.className = 'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out translate-x-6';
                                } else {
                                    button.className = 'w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out bg-gray-300 dark:bg-gray-600';
                                    knob.className = 'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out';
                                }
                            };

                            updateUI(getterRef.current);
                            
                            L.DomEvent.on(button, 'click', () => {
                                const newState = !getterRef.current;
                                setter(newState);
                                updateUI(newState);
                            });

                            return wrapper;
                        };

                        createToggle('ndvi-toggle-map', 'NDVI Overlay', isNdviVisibleRef, setIsNdviVisible);
                        L.DomUtil.create('div', 'h-2', container);
                        createToggle('rainfall-toggle-map', 'Rainfall Forecast', isRainfallVisibleRef, setIsRainfallVisible);

                        return container;
                    },
                });
                const toggleControl = new OverlayToggleControl({ position: 'topright' });
                map.addControl(toggleControl);
                // Move it before the layers control
                 if (layersControl.getContainer() && toggleControl.getContainer().parentNode) {
                    toggleControl.getContainer().parentNode.insertBefore(toggleControl.getContainer(), layersControl.getContainer());
                }
            }


            // --- ADD DRAWING CONTROLS ---
            const drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            const drawControl = new (L.Control as any).Draw({
                position: 'topright',
                edit: { featureGroup: drawnItems },
                draw: {
                    polygon: { shapeOptions: { color: '#22c55e' } },
                    polyline: { shapeOptions: { color: '#f97316' } },
                    rectangle: { shapeOptions: { color: '#3b82f6' } },
                    circle: { shapeOptions: { color: '#8b5cf6' } },
                    marker: false,
                }
            });
            map.addControl(drawControl);

            map.on('draw:created', (event: any) => {
                const layer = event.layer;
                drawnItems.addLayer(layer);

                let popupContent = 'Shape added!';
                if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                    const latlngs = (layer as L.Polygon).getLatLngs();
                    if (latlngs && latlngs[0] && latlngs[0].length > 2) {
                        const area = L.GeometryUtil.geodesicArea(latlngs[0]);
                        const areaHectares = (area / 10000).toFixed(2);
                        const areaAcres = (area / 4046.86).toFixed(2);
                        popupContent = `<b>Area</b><br>${areaHectares} hectares<br>${areaAcres} acres`;
                    } else {
                        popupContent = `<b>Polygon Added</b><br>Area calculation failed.`;
                    }
                } else if (layer instanceof L.Polyline) {
                    const latlngs = (layer as L.Polyline).getLatLngs() as L.LatLng[];
                    let distance = 0;
                    for (let i = 0; i < latlngs.length - 1; i++) {
                        distance += latlngs[i].distanceTo(latlngs[i + 1]);
                    }
                    const distanceKm = (distance / 1000).toFixed(2);
                    popupContent = `<b>Length</b><br>${distanceKm} km`;
                } else if (layer instanceof L.Circle) {
                    const radius = (layer as L.Circle).getRadius();
                    const area = Math.PI * radius * radius;
                    const areaHectares = (area / 10000).toFixed(2);
                    const areaAcres = (area / 4046.86).toFixed(2);
                    popupContent = `<b>Area</b><br>${areaHectares} hectares<br>${areaAcres} acres`;
                }
                layer.bindPopup(popupContent).openPopup();
            });
            
            // --- EVENT LISTENERS ---
            map.on('overlayadd', (e: L.LayersControlEvent) => {
                if (e.name === 'Soil Moisture') setShowSoilMoisture(true);
            });
            map.on('overlayremove', (e: L.LayersControlEvent) => {
                if (e.name === 'Soil Moisture') setShowSoilMoisture(false);
            });
             map.on('click', (e: L.LeafletMouseEvent) => {
                // Ignore clicks on interactive layers (like polygons or markers)
                if ((e.originalEvent.target as HTMLElement).closest('.leaflet-interactive, .leaflet-control')) {
                    return;
                }
                setSelectedPlot(null);
                handlePointAnalysis(e.latlng);
            });
        }
    }, [showControls]);

    // Effect to generate rainfall data when location is available
    useEffect(() => {
        if (location && !rainfallGeoJson) {
            setRainfallGeoJson(generateRainfallData(location));
        }
    }, [location, rainfallGeoJson]);

    // Effect to control rainfall layer visibility
    useEffect(() => {
        const map = mapRef.current;
        const layer = rainfallLayerRef.current;
        if (!map || !layer) return;

        if (isRainfallVisible && rainfallGeoJson) {
            layer.clearLayers().addData(rainfallGeoJson);
            if (!map.hasLayer(layer)) {
                map.addLayer(layer);
                layer.bringToBack();
            }
        } else {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        }
    }, [isRainfallVisible, rainfallGeoJson]);

    // Effect to update farm data and styles when props change
    useEffect(() => {
        const layer = farmPlotsLayerRef.current;
        const map = mapRef.current;
        if (!layer || !map || !farmGeoData) return;
        
        // Update data
        layer.clearLayers();
        layer.addData(farmGeoData as any);
        
        // Re-apply styles
        layer.eachLayer((l: any) => {
            const feature = l.feature;
            const style = isNdviVisible 
                ? getNdviStyle(feature.properties.ndvi)
                : getCropStyle(feature.properties.crop);
            l.setStyle(style);
        });

        // Fit map to bounds on first data load
        if (farmGeoData.features.length > 0 && map.getZoom() === 13) { // Heuristic for initial load
             map.fitBounds(layer.getBounds());
        }

    }, [farmGeoData, isNdviVisible]);


    // Effect to handle selection highlighting
    useEffect(() => {
        const layer = farmPlotsLayerRef.current;
        if (!layer) return;

        layer.eachLayer((l: any) => {
            const isSelected = selectedPlot && l.feature.properties.name === selectedPlot.name;
            if (isSelected) {
                l.setStyle({ weight: 4, color: '#10b981', dashArray: '' });
                l.bringToFront();
            } else {
                // Revert to the correct style based on the current view mode
                const style = isNdviVisible 
                    ? getNdviStyle(l.feature.properties.ndvi)
                    : getCropStyle(l.feature.properties.crop);
                l.setStyle(style);
            }
        });
    }, [selectedPlot, isNdviVisible, farmGeoData]);


    useEffect(() => {
        const map = mapRef.current;
        if (!map || !location) return;

        const userLocationIcon = L.divIcon({
            html: '',
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10],
        });

        const latLng: L.LatLngExpression = [location.lat, location.lon];

        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng(latLng);
        } else {
            userLocationMarkerRef.current = L.marker(latLng, { icon: userLocationIcon })
                .addTo(map)
                .bindPopup('Your approximate location');
        }
        
        if (!selectedPlot && !hasCenteredOnUser) {
            map.setView(latLng, 14);
            setHasCenteredOnUser(true);
        }
    }, [location, selectedPlot, hasCenteredOnUser]);

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full" />
            <BottomSheet plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
             <PointAnalysisSheet 
                analysis={analysisPoint} 
                isLoading={isPointAnalyzing} 
                onClose={() => {
                    setAnalysisPoint(null);
                    analysisMarkerRef.current?.remove();
                }} 
            />
            <MapLegend 
                showNdvi={isNdviVisible} 
                showSoilMoisture={showSoilMoisture}
                showRainfall={isRainfallVisible} 
            />
        </div>
    );
};

export default InteractiveMap;