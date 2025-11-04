import React from 'react';
import InteractiveMap from './InteractiveMap';
import { CloudIcon, LeafIcon, WaterDropIcon, AlertIcon, WeatherSunIcon } from './Icons';

const Dashboard: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">नमामत, किसान!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, Farmer!</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 border border-gray-200 dark:border-gray-700">
                <div className="w-full h-40 md:h-48 rounded-lg overflow-hidden">
                    <InteractiveMap location={{ lat: 51.505, lon: -0.09 }} />
                </div>
                <div className="flex justify-between items-center p-2">
                    <div className="flex items-center space-x-2">
                        <WeatherSunIcon className="w-6 h-6 text-yellow-500" />
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-100">32°C</span>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">फसल शास्त्र: अच्छा</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">(NDVI: 0.82)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center bg-green-500/10 dark:bg-green-500/20 text-green-800 dark:text-green-200 p-3 rounded-lg text-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <CloudIcon className="w-7 h-7 mb-1" />
                    <span className="text-xs font-semibold">मौसम और जलवायु</span>
                </div>
                 <div className="flex flex-col items-center justify-center bg-green-500/10 dark:bg-green-500/20 text-green-800 dark:text-green-200 p-3 rounded-lg text-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <LeafIcon className="w-7 h-7 mb-1" />
                    <span className="text-xs font-semibold">फसल स्वास्थ्य सलाह</span>
                </div>
                 <div className="flex flex-col items-center justify-center bg-green-500/10 dark:bg-green-500/20 text-green-800 dark:text-green-200 p-3 rounded-lg text-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <WaterDropIcon className="w-7 h-7 mb-1" />
                    <span className="text-xs font-semibold">सिंचाई और जल प्रबंधन</span>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">अलर्ट</h3>
                <div className="space-y-3">
                    <div className="bg-yellow-100 dark:bg-yellow-800/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-3 rounded-r-lg flex items-center">
                        <AlertIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-sm">रोग की शुरुवात:</p>
                            <p className="text-xs">पालेपा पर धब्बा</p>
                        </div>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-800/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-3 rounded-r-lg flex items-center">
                        <AlertIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-sm">बौरों का सम्बाग (अगले 24 घंटे)</p>
                            <p className="text-xs">भारी बारिश की संभावना</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
