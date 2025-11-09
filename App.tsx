

import React, { useState, useEffect, useMemo } from 'react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FarmMap from './components/FarmMap';
import CropHealth from './components/CropHealth';
import Profile from './components/Profile';
import Weather from './components/Weather';
import BottomNav from './components/BottomNav';
import GeoAIAssistant from './components/GeoAIAssistant';
import LiveAssistant from './components/LiveAssistant';
import Analytics from './components/Analytics';
import IconButton from './components/common/IconButton';

import { AgriSenseLogo, UserIcon as ProfileIcon, HamburgerMenuIcon } from './components/Icons';

export type Page = 'Dashboard' | 'Map' | 'Scan' | 'Forecast' | 'Profile' | 'Chat' | 'Live' | 'Analytics';
type LocationState = { lat: number, lon: number } | null;

const initialFarmGeoData = {
    "type": "FeatureCollection",
    "features": [
        { 
            "type": "Feature", 
            "properties": { "name": "Wheat Field A", "crop": "Wheat", "ndvi": 0.92, "soil_moisture": "Optimal" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.509 ], [ -0.09, 51.512 ], [ -0.08, 51.512 ], [ -0.08, 51.509 ], [ -0.09, 51.509 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Corn Plot 3", "crop": "Corn", "ndvi": 0.85, "soil_moisture": "Optimal" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.51 ], [ -0.07, 51.513 ], [ -0.06, 51.513 ], [ -0.06, 51.51 ], [ -0.07, 51.51 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Soybean Field", "crop": "Soybean", "ndvi": 0.60, "soil_moisture": "Dry" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.09, 51.505 ], [ -0.09, 51.507 ], [ -0.08, 51.507 ], [ -0.08, 51.505 ], [ -0.09, 51.505 ] ] ] } 
        },
        { 
            "type": "Feature", 
            "properties": { "name": "Vineyard", "crop": "Vineyard", "ndvi": 0.78, "soil_moisture": "Wet" }, 
            "geometry": { "type": "Polygon", "coordinates": [ [ [ -0.07, 51.505 ], [ -0.07, 51.507 ], [ -0.06, 51.507 ], [ -0.06, 51.505 ], [ -0.07, 51.505 ] ] ] } 
        }
    ]
};

// This function simulates small, random changes to farm data over time.
const simulateFarmDataUpdate = (prevData: typeof initialFarmGeoData) => {
    const newFeatures = prevData.features.map(feature => {
        // Slightly adjust NDVI value
        const ndviChange = (Math.random() - 0.5) * 0.05;
        const newNdvi = Math.max(0.1, Math.min(0.99, feature.properties.ndvi + ndviChange));
        
        // Occasionally change soil moisture
        const moistureLevels = ["Dry", "Optimal", "Wet"];
        const newMoisture = Math.random() < 0.05 // 5% chance to change
            ? moistureLevels[Math.floor(Math.random() * 3)] 
            : feature.properties.soil_moisture;

        return {
            ...feature,
            properties: {
                ...feature.properties,
                ndvi: parseFloat(newNdvi.toFixed(2)),
                soil_moisture: newMoisture,
            }
        };
    });
    return { ...prevData, features: newFeatures };
};


const PageContent: React.FC<{ 
    activePage: Page; 
    setPage: (page: Page) => void; 
    location: LocationState;
    farmGeoData: typeof initialFarmGeoData;
    farmSummary: any;
    lastUpdated: Date;
}> = ({ activePage, setPage, location, farmGeoData, farmSummary, lastUpdated }) => {
  switch (activePage) {
    case 'Dashboard':
      return <Dashboard location={location} setPage={setPage} farmGeoData={farmGeoData} farmSummary={farmSummary} lastUpdated={lastUpdated} />;
    case 'Map':
      return <FarmMap location={location} farmGeoData={farmGeoData} />;
    case 'Scan':
      return <CropHealth />;
    case 'Forecast':
      return <Weather location={location} />;
    case 'Profile':
      return <Profile setPage={setPage} />;
    case 'Chat':
      return <GeoAIAssistant setPage={setPage} farmSummary={farmSummary} />;
    case 'Live':
      return <LiveAssistant setPage={setPage} />;
    case 'Analytics':
      return <Analytics setPage={setPage} farmSummary={farmSummary} />;
    default:
      return <Dashboard location={location} setPage={setPage} farmGeoData={farmGeoData} farmSummary={farmSummary} lastUpdated={lastUpdated} />;
  }
};

const getPageTitle = (page: Page): string => {
    if (page === 'Chat') return 'AI Geo Assistant';
    if (page === 'Scan') return 'Crop Health Analysis';
    if (page === 'Live') return 'Live AI Assistant';
    if (page === 'Forecast') return 'Weather & Forecast';
    if (page === 'Analytics') return 'Analytics & Reports';
    return page;
}

const AppHeader: React.FC<{page: Page}> = ({ page }) => {
    const title = getPageTitle(page);
    const showLogo = page === 'Dashboard';
    
    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm z-10">
            <div className="flex items-center justify-between h-16 px-4">
                <IconButton variant="subtle" size="sm" aria-label="Open menu">
                    <HamburgerMenuIcon className="w-6 h-6" />
                </IconButton>
                <div className="flex flex-col items-center">
                   {showLogo && <AgriSenseLogo className="h-7 w-7 text-green-600" />}
                   <h1 className={`font-bold ${showLogo ? 'text-sm' : 'text-lg'} text-gray-800 dark:text-gray-100`}>
                       {showLogo ? 'AgriSense AI' : title}
                   </h1>
                </div>
                <IconButton variant="subtle" size="sm" aria-label="View profile">
                    <ProfileIcon className="w-7 h-7" />
                </IconButton>
            </div>
        </header>
    );
};


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [location, setLocation] = useState<LocationState>(null);
  const [farmGeoData, setFarmGeoData] = useState(initialFarmGeoData);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Location Fetching Effect
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // PERMISSION_DENIED is a common case, not necessarily an "error".
        if (error.code === error.PERMISSION_DENIED) {
          console.info("User denied Geolocation. Falling back to a default location.");
        } else {
          console.error(`Geolocation error: ${error.message} (code: ${error.code})`);
        }
        // Fallback to a default location if permission is denied or an error occurs
        setLocation({ lat: 26.12, lon: 85.9 }); // Darbhanga, Bihar
      }
    );
  }, []);

  // Real-time Farm Data Simulation Effect
  useEffect(() => {
      const intervalId = setInterval(() => {
          setFarmGeoData(simulateFarmDataUpdate);
          setLastUpdated(new Date());
      }, 15000); // Update every 15 seconds

      return () => clearInterval(intervalId);
  }, []);

  const farmSummary = useMemo(() => {
      if (!farmGeoData || farmGeoData.features.length === 0) {
          return { avgNdvi: 0, soilMoisture: 'Unknown' };
      }
      const avgNdvi = farmGeoData.features.reduce((acc, f) => acc + f.properties.ndvi, 0) / farmGeoData.features.length;
      const moistureCounts: { [key: string]: number } = farmGeoData.features.reduce((acc, f) => {
          const moisture = f.properties.soil_moisture;
          acc[moisture] = (acc[moisture] || 0) + 1;
          return acc;
      }, {} as { [key: string]: number });

      const dominantMoisture = Object.keys(moistureCounts).reduce((a, b) => moistureCounts[a] > moistureCounts[b] ? a : b);
      
      return {
          avgNdvi: parseFloat(avgNdvi.toFixed(2)),
          dominantMoisture: dominantMoisture
      };
  }, [farmGeoData]);


  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }
  
  const isMapView = activePage === 'Map';

  return (
    <div className={`w-full min-h-screen bg-gray-200 dark:bg-black font-sans ${!isMapView && 'flex items-center justify-center p-0 sm:p-4'}`}>
        <div className={isMapView 
            ? "w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" 
            : "w-full max-w-md lg:max-w-lg xl:max-w-xl h-screen sm:h-[90vh] sm:max-h-[800px] bg-gray-50 dark:bg-gray-900 shadow-2xl sm:rounded-3xl flex flex-col overflow-hidden"
        }>
        
            {activePage !== 'Chat' && activePage !== 'Live' && activePage !== 'Analytics' && <AppHeader page={activePage} />}
            
            <main className={`flex-grow ${isMapView ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <PageContent 
                activePage={activePage} 
                setPage={setActivePage} 
                location={location}
                farmGeoData={farmGeoData}
                farmSummary={farmSummary}
                lastUpdated={lastUpdated}
              />
            </main>
            
            {activePage !== 'Chat' && activePage !== 'Live' && activePage !== 'Analytics' && (
                <BottomNav activePage={activePage} setPage={setActivePage} />
            )}

        </div>
    </div>
  );
};

export default App;