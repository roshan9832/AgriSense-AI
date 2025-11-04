import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import InteractiveMap from './InteractiveMap';
import { WaterSourceIcon, WeatherStationIcon } from './Icons';

interface MapLegendProps {
    showNdvi: boolean;
    showSoilMoisture: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showNdvi, showSoilMoisture }) => (
    <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] w-52 text-xs transition-all duration-300">
        <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-1">Legend</h4>
        
        {/* NDVI Section */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showNdvi ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
             <p className="font-semibold text-gray-700 dark:text-gray-200">NDVI Health</p>
             <div className="w-full h-3 my-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 border border-gray-200 dark:border-gray-600"></div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400 text-[10px] px-1">
                 <span>Low (&lt;0.2)</span>
                 <span>Mid (~0.5)</span>
                 <span>High (&gt;0.8)</span>
             </div>
        </div>

        {/* Soil Moisture Section */}
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
        
        {/* Points of Interest Section - always visible */}
        <div className={`pt-2 transition-all duration-300 ease-in-out ${(showNdvi || showSoilMoisture) ? 'mt-2 border-t border-gray-300 dark:border-gray-600' : ''}`}>
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


const FarmMap: React.FC = () => {
    const [satellite, setSatellite] = useState(true);
    const [ndvi, setNdvi] = useState(true);
    const [soil, setSoil] = useState(false);

    return (
        <div className="p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 border border-gray-200 dark:border-gray-700">
                <div className="w-full h-80 md:h-96 lg:h-[28rem] rounded-lg overflow-hidden">
                    <InteractiveMap 
                        location={{ lat: 51.505, lon: -0.09 }} 
                        showNdvi={ndvi}
                        showSoilMoisture={soil}
                        mapType={satellite ? 'satellite' : 'street'}
                    />
                </div>
                
                <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-md text-sm z-[1000] space-y-3">
                    <ToggleSwitch id="satellite-toggle" label="Satellite View" enabled={satellite} setEnabled={setSatellite} />
                    <ToggleSwitch id="ndvi-toggle" label="NDVI Layer" enabled={ndvi} setEnabled={setNdvi} />
                    <ToggleSwitch id="soil-toggle" label="Soil Moisture" enabled={soil} setEnabled={setSoil} />
                </div>

                <MapLegend showNdvi={ndvi} showSoilMoisture={soil} />
            </div>

            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Alerts</h3>
                 <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-center text-gray-500 dark:text-gray-400">
                    No active alerts for this map area.
                 </div>
            </div>
            
            <button className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 active:scale-95">
                खेत की बानबन्दी बमोमें
            </button>
        </div>
    );
};

export default FarmMap;