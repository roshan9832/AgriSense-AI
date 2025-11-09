
import React, { useState } from 'react';
import { Page } from '../App';
import IconButton from './common/IconButton';
import Button from './common/Button';
import { ArrowLeftIcon, TrendingUpIcon, DownloadIcon, RupeeIcon, LeafIcon, WeatherRainIcon, ChartBarIcon } from './Icons';

interface AnalyticsProps {
    setPage: (page: Page) => void;
    farmSummary: any;
}

const previousSeasonData = {
    season: "Kharif 2023",
    yield: 2.9,
    profit: 62500,
    ndvi: 0.72,
    rainfall: 510
};


const StatCard: React.FC<{
    icon: React.ReactElement;
    title: string;
    currentValue: string;
    previousValue: string;
    change: number;
}> = ({ icon, title, currentValue, previousValue, change }) => {
    const isPositive = change >= 0;
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                {icon}
                <span className="font-semibold ml-2">{title}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentValue}</p>
            <div className="flex justify-between items-baseline mt-1 text-sm">
                <p className="text-gray-500 dark:text-gray-400">vs {previousValue}</p>
                <p className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                </p>
            </div>
        </div>
    );
};


const Analytics: React.FC<AnalyticsProps> = ({ setPage, farmSummary }) => {
    const [season, setSeason] = useState('vs_previous');

    // Combine static previous data with live current data
    const comparisonData = {
        current: {
            season: "Kharif 2024",
            yield: 3.2, // Placeholder, can be made dynamic
            profit: 68800, // Placeholder
            ndvi: farmSummary.avgNdvi,
            rainfall: 450 // Placeholder
        },
        previous: previousSeasonData
    };


    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
                <IconButton variant="subtle" size="sm" onClick={() => setPage('Dashboard')} aria-label="Go back">
                    <ArrowLeftIcon className="w-6 h-6" />
                </IconButton>
                <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Analytics & Reports</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-grow p-4 space-y-6 overflow-y-auto">
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-xl">Season Comparison</h2>
                    {/* Season Selector would go here */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard 
                            icon={<TrendingUpIcon className="w-5 h-5"/>}
                            title="Yield (ton/ha)"
                            currentValue={comparisonData.current.yield.toFixed(1)}
                            previousValue={comparisonData.previous.yield.toFixed(1)}
                            change={((comparisonData.current.yield - comparisonData.previous.yield) / comparisonData.previous.yield) * 100}
                        />
                        <StatCard 
                            icon={<RupeeIcon className="w-5 h-5"/>}
                            title="Est. Profit (/ha)"
                            currentValue={`₹${(comparisonData.current.profit / 1000).toFixed(1)}k`}
                            previousValue={`₹${(comparisonData.previous.profit / 1000).toFixed(1)}k`}
                            change={((comparisonData.current.profit - comparisonData.previous.profit) / comparisonData.previous.profit) * 100}
                        />
                        <StatCard 
                            icon={<LeafIcon className="w-5 h-5"/>}
                            title="Avg. NDVI"
                            currentValue={comparisonData.current.ndvi.toFixed(2)}
                            previousValue={comparisonData.previous.ndvi.toFixed(2)}
                            change={((comparisonData.current.ndvi - comparisonData.previous.ndvi) / comparisonData.previous.ndvi) * 100}
                        />
                         <StatCard 
                            icon={<WeatherRainIcon className="w-5 h-5"/>}
                            title="Total Rainfall (mm)"
                            currentValue={`${comparisonData.current.rainfall}`}
                            previousValue={`${comparisonData.previous.rainfall}`}
                            change={((comparisonData.current.rainfall - comparisonData.previous.rainfall) / comparisonData.previous.rainfall) * 100}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <ChartBarIcon className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Historical Charts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Detailed charts for NDVI, weather, and more are coming soon.</p>
                </div>
                
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-xl">Download Reports</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button variant="tertiary" size="md"><DownloadIcon className="w-4 h-4 mr-2"/>NDVI Report</Button>
                        <Button variant="tertiary" size="md"><DownloadIcon className="w-4 h-4 mr-2"/>Crop Health Report</Button>
                        <Button variant="tertiary" size="md"><DownloadIcon className="w-4 h-4 mr-2"/>Weather Report</Button>
                        <Button variant="tertiary" size="md"><DownloadIcon className="w-4 h-4 mr-2"/>Soil Analysis Report</Button>
                         <Button variant="primary" size="md" className="sm:col-span-2"><DownloadIcon className="w-4 h-4 mr-2"/>AI Insights Summary (PDF)</Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Analytics;