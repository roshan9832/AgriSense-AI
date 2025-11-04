
import React, { useState } from 'react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FarmMap from './components/FarmMap';
import CropHealth from './components/CropHealth';
import Profile from './components/Profile';
import PlaceholderPage from './components/PlaceholderPage';
import BottomNav from './components/BottomNav';
import GeoAIAssistant from './components/GeoAIAssistant';

import { AgriSenseLogo, UserIcon as ProfileIcon, HamburgerMenuIcon } from './components/Icons';

type Page = 'Dashboard' | 'Map' | 'Scan' | 'Forecast' | 'Profile' | 'Chat';

const PageContent: React.FC<{ activePage: Page; setPage: (page: Page) => void }> = ({ activePage, setPage }) => {
  switch (activePage) {
    case 'Dashboard':
      return <Dashboard />;
    case 'Map':
      return <FarmMap />;
    case 'Scan':
      return <CropHealth />;
    case 'Forecast':
      return <PlaceholderPage title="Forecast & Prediction" />;
    case 'Profile':
      return <Profile setPage={setPage} />;
    case 'Chat':
      return <GeoAIAssistant />;
    default:
      return <Dashboard />;
  }
};

const getPageTitle = (page: Page): string => {
    if (page === 'Chat') return 'AI Geo Assistant';
    if (page === 'Scan') return 'Crop Health Analysis';
    return page;
}

const AppHeader: React.FC<{page: Page}> = ({ page }) => {
    const title = getPageTitle(page);
    const showLogo = page === 'Dashboard';
    
    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4">
                <button className="p-2 text-gray-600 dark:text-gray-300">
                    <HamburgerMenuIcon className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                   {showLogo && <AgriSenseLogo className="h-7 w-7 text-green-600" />}
                   <h1 className={`font-bold ${showLogo ? 'text-sm' : 'text-lg'} text-gray-800 dark:text-gray-100`}>
                       {showLogo ? 'AgriSense AI' : title}
                   </h1>
                </div>
                <button className="p-2 text-gray-600 dark:text-gray-300">
                    <ProfileIcon className="w-7 h-7" />
                </button>
            </div>
        </header>
    );
};


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-200 dark:bg-black flex items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-screen sm:h-[90vh] sm:max-h-[800px] bg-gray-50 dark:bg-gray-900 shadow-2xl sm:rounded-3xl flex flex-col overflow-hidden">
        
        {/* Do not show header for chat page as it has its own */}
        {activePage !== 'Chat' && <AppHeader page={activePage} />}
        
        <main className="flex-grow overflow-y-auto">
          <PageContent activePage={activePage} setPage={setActivePage} />
        </main>
        
        {/* Do not show bottom nav for chat page */}
        {activePage !== 'Chat' && (
            <BottomNav activePage={activePage} setPage={setActivePage} />
        )}

      </div>
    </div>
  );
};

export default App;