import React from 'react';
import { HomeIcon, MapIcon, ScanIcon, ChartIcon, UserIcon } from './Icons';

interface BottomNavProps {
    activePage: string;
    setPage: (page: string) => void;
}

const navItems = [
    { name: 'Home', page: 'Dashboard', icon: HomeIcon },
    { name: 'Map', page: 'Map', icon: MapIcon },
    { name: 'Scan', page: 'Scan', icon: ScanIcon },
    { name: 'Forecast', page: 'Forecast', icon: ChartIcon },
    { name: 'Profile', page: 'Profile', icon: UserIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setPage }) => {
    return (
        <nav className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = activePage === item.page;
                    return (
                        <button 
                            key={item.name}
                            onClick={() => setPage(item.page)}
                            className={`flex flex-col items-center justify-center text-center w-full transition-all duration-200 active:translate-y-0.5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-500'}`}
                            aria-label={item.name}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <item.icon className={`h-6 w-6 mb-1 ${isActive ? 'stroke-[2]' : ''}`} />
                            <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                                {item.name}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
