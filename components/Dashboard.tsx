
import React from 'react';
import { Page } from '../App';
import InteractiveMap from './InteractiveMap';
import { 
    UserIcon, RefreshIcon, SettingsIcon, LightbulbIcon,
    LeafIcon, TrendingUpIcon, RupeeIcon, CloudIcon, WaterDropIcon, FlaskIcon,
    DownloadIcon, ChatIcon, ScanIcon, ChartBarIcon, MapIcon
} from './Icons';
import IconButton from './common/IconButton';
import Button from './common/Button';

interface DashboardProps {
    location: { lat: number; lon: number } | null;
    setPage: (page: Page) => void;
    farmGeoData: any;
    farmSummary: any;
    lastUpdated: Date;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
};

const InfoCard: React.FC<{
    icon: React.ReactElement;
    title: string;
    value: string;
    trend?: string;
    colorClass: string;
    onClick?: () => void;
}> = ({ icon, title, value, trend, colorClass, onClick }) => (
    <div onClick={onClick} className={`p-3 rounded-xl shadow-sm bg-white dark:bg-gray-800 flex items-center space-x-3 border-l-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} ${colorClass}`}>
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
        {trend && <p className="text-xs font-semibold ml-auto">{trend}</p>}
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ location, setPage, farmGeoData, farmSummary, lastUpdated }) => {
    
    const getNdviHealthText = (ndvi: number) => {
        if (ndvi > 0.8) return 'Very Healthy';
        if (ndvi > 0.5) return 'Healthy';
        if (ndvi > 0.2) return 'Moderate';
        return 'Stressed';
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            {/* 1. Header / Profile Bar */}
            <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-green-300 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 dark:text-gray-100">Roshan’s Smart Farm</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">📍 Darbhanga, Bihar</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Updated: {timeAgo(lastUpdated)}</span>
                        <IconButton variant="subtle" size="sm" aria-label="Refresh data"><RefreshIcon className="w-5 h-5"/></IconButton>
                        <IconButton variant="subtle" size="sm" aria-label="Settings"><SettingsIcon className="w-5 h-5"/></IconButton>
                    </div>
                </div>
                 <p className="text-sm text-center mt-3 text-green-800 dark:text-green-300 font-medium">Your Farm, Your Crop, Your AI — All in one place.</p>
            </header>
            
            <main className="p-4 space-y-4">
                {/* 2. Farm Overview Map */}
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <InteractiveMap location={location} isNdviVisible={true} farmGeoData={farmGeoData}/>
                </div>
                
                {/* 3, 4, 5. Main Widgets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard 
                        icon={<LeafIcon className="w-8 h-8 text-green-500"/>}
                        title="Avg. Crop Health (NDVI)" 
                        value={`${farmSummary.avgNdvi} — ${getNdviHealthText(farmSummary.avgNdvi)}`}
                        colorClass="border-green-500"
                    />
                     <InfoCard 
                        icon={<WaterDropIcon className="w-8 h-8 text-blue-500"/>}
                        title="Dominant Soil Moisture" 
                        value={farmSummary.dominantMoisture}
                        colorClass="border-blue-500"
                    />
                     <InfoCard 
                        icon={<CloudIcon className="w-8 h-8 text-sky-500"/>}
                        title="Rain Probability (3d)" value="67%"
                        colorClass="border-sky-500"
                        onClick={() => setPage('Forecast')}
                    />
                     <InfoCard 
                        icon={<FlaskIcon className="w-8 h-8 text-amber-500"/>}
                        title="Nitrogen Level" value="Low ⚠️"
                        colorClass="border-amber-500"
                    />
                </div>

                {/* 6. Yield & Profit */}
                <div className="grid grid-cols-2 gap-4">
                     <InfoCard 
                        icon={<TrendingUpIcon className="w-8 h-8 text-indigo-500"/>}
                        title="Predicted Yield" value="3.2 ton/ha"
                        colorClass="border-indigo-500"
                    />
                     <InfoCard 
                        icon={<RupeeIcon className="w-8 h-8 text-emerald-500"/>}
                        title="Estimated Profit" value="₹68,800/ha"
                        colorClass="border-emerald-500"
                    />
                </div>

                {/* 7. Smart AI Recommendations */}
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                        <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-400"/>
                        Smart AI Recommendations
                    </h3>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">💡 <span className="font-semibold">Apply 50 kg Urea in 3 days</span> due to low nitrogen levels.</p>
                        <p className="text-gray-700 dark:text-gray-300">🌱 Rain expected soon — <span className="font-semibold">skip irrigation this week</span> to save water.</p>
                        <p className="text-gray-700 dark:text-gray-300">📉 <span className="font-semibold text-orange-600 dark:text-orange-400">NDVI decreased by 12% in north-west zone.</span> Investigate for pests.</p>
                    </div>
                </div>

                {/* 9. Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                     <Button onClick={() => setPage('Scan')} variant="secondary" size="md" className="!py-4">
                        <ScanIcon className="w-5 h-5 mr-2"/>Scan Crop
                    </Button>
                    <Button onClick={() => setPage('Chat')} variant="secondary" size="md" className="!py-4">
                        <ChatIcon className="w-5 h-5 mr-2"/>Chat with AI
                    </Button>
                     <Button onClick={() => setPage('Analytics')} variant="secondary" size="md" className="!py-4 col-span-2">
                        <ChartBarIcon className="w-5 h-5 mr-2"/>Compare Seasons & Reports
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;