
import React, { useState, useEffect } from 'react';
import {
  CropIcon,
  WaterIcon,
  ClimateIcon,
  SatelliteIcon,
  ChartIcon,
  SupplyChainIcon,
  PolicyIcon,
  MapIcon,
  LightbulbIcon,
  MobileIcon,
  AgriSenseLogo,
  TwitterIcon,
  LinkedInIcon,
  MoonIcon,
  SunIcon,
  WaterSourceIcon,
  WeatherStationIcon,
  BotIcon,
} from './components/Icons';
import InteractiveMap from './components/InteractiveMap';
import Weather from './components/Weather';
import GeoAIAssistant from './components/GeoAIAssistant';

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const modules = [
  {
    icon: <SatelliteIcon className="h-8 w-8 text-indigo-500" />,
    title: "Satellite & Drone Data Integration",
    description: "उपग्रह (Sentinel, Landsat) या ड्रोन इमेज से फसल स्वास्थ्य, NDVI, मिट्टी की नमी आदि की पहचान",
  },
  {
    icon: <CropIcon className="h-8 w-8 text-green-500" />,
    title: "Crop Health Monitoring (AI Vision)",
    description: "CNN मॉडल से पत्तियों/फसल की इमेज का विश्लेषण कर रोग, कीट या तनाव का पता लगाना",
  },
  {
    icon: <WaterIcon className="h-8 w-8 text-blue-500" />,
    title: "Soil & Water Intelligence",
    description: "सैटेलाइट डेटा + सेंसर डेटा से मिट्टी की उर्वरता, नमी और सिंचाई पैटर्न का विश्लेषण",
  },
  {
    icon: <ChartIcon className="h-8 w-8 text-purple-500" />,
    title: "Yield Forecasting & Predictive Analytics",
    description: "ML मॉडल (Random Forest, LSTM) से उपज पूर्वानुमान, मौसम जोखिम, और फसल सुझाव",
  },
  {
    icon: <MapIcon className="h-8 w-8 text-orange-500" />,
    title: "GIS Mapping Dashboard",
    description: "इंटरैक्टिव मैप जिसमें खेत, फसल, और संसाधन डेटा को विज़ुअल रूप में दिखाया जाए",
  },
  {
    icon: <ClimateIcon className="h-8 w-8 text-yellow-500" />,
    title: "Weather & Climate Insights",
    description: "OpenWeather API से मौसम और जलवायु पैटर्न की रियल-टाइम जानकारी",
  },
  {
    icon: <LightbulbIcon className="h-8 w-8 text-teal-500" />,
    title: "GeoAI Recommendations",
    description: "मिट्टी-फसल-मौसम आधारित सिफारिशें: कौन-सी फसल बोनी चाहिए, कब सिंचाई करनी चाहिए",
  },
  {
    icon: <SupplyChainIcon className="h-8 w-8 text-cyan-500" />,
    title: "Supply Chain & Market Intelligence",
    description: "निकटतम मंडी मूल्य, फसल परिवहन मार्ग, स्टोरेज सुझाव",
  },
  {
    icon: <MobileIcon className="h-8 w-8 text-rose-500" />,
    title: "Farmer Dashboard (Mobile)",
    description: "यूज़र के खेत के लोकेशन आधारित डेटा और सुझाव — मोबाइल UI",
  },
  {
    icon: <PolicyIcon className="h-8 w-8 text-slate-500" />,
    title: "Data Governance & Ethics",
    description: "सुरक्षित डेटा उपयोग, किसानों की गोपनीयता, और पारदर्शिता नीति",
  },
];

const ModuleCard: React.FC<ModuleCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:shadow-none dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 p-6 flex flex-col items-start h-full border border-gray-100 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
        {icon}
      </div>
      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">{description}</p>
      <a href="#" className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 mt-4 group">
        Explore <span className="transition-transform duration-300 group-hover:translate-x-1 inline-block">→</span>
      </a>
    </div>
  );
};

interface NavbarProps {
  theme: string;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                    <AgriSenseLogo className="h-8 w-8 text-green-600" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">AgriSense AI</span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 font-medium">Dashboard</a>
                    <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 font-medium">Analytics</a>
                    <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 font-medium">Market</a>
                    <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 font-medium">Community</a>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                      aria-label="Toggle dark mode"
                    >
                      {theme === 'light' ? (
                        <MoonIcon className="h-6 w-6" />
                      ) : (
                        <SunIcon className="h-6 w-6" />
                      )}
                    </button>
                    <button className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-4 py-2 rounded-md">Login</button>
                    <button className="bg-green-600 text-white hover:bg-green-700 font-medium px-4 py-2 rounded-md shadow-sm">Sign Up</button>
                </div>
            </div>
        </div>
    </nav>
);

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <AgriSenseLogo className="h-7 w-7 text-green-600" />
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">AgriSense AI</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Making agriculture future-ready with data.</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">Dashboard</a></li>
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">Features</a></li>
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">About Us</a></li>
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">Careers</a></li>
            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500">Contact</a></li>
          </ul>
        </div>
        <div>
           <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Follow Us</h4>
           <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500"><TwitterIcon className="h-6 w-6" /></a>
              <a href="#" className="text-gray-400 hover:text-gray-500"><LinkedInIcon className="h-6 w-6" /></a>
           </div>
        </div>
      </div>
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} AgriSense AI. All rights reserved.</p>
      </div>
    </div>
  </footer>
);


const App: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string|null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
                setLocationError(null);
            },
            (error: GeolocationPositionError) => {
                console.error("Error getting location:", error);
                
                // Prioritize the browser's own human-readable message.
                let errorMessage = error.message;

                // For the most common error, provide a more helpful, actionable message.
                if (error.code === 1) { // PERMISSION_DENIED
                    errorMessage = "Geolocation permission was denied. Please enable it in your browser settings to use location-based features.";
                }

                setLocationError(errorMessage);
            }
        );
    } else {
        setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="pt-16">
        <section className="text-center py-20 md:py-28 px-4 bg-white dark:bg-gray-900">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-green-500 to-blue-500 text-transparent bg-clip-text">
                  AgriSense AI
                </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              “AI और Geospatial डेटा से कृषि को भविष्य के अनुरूप बनाना — सटीक, टिकाऊ और डेटा-ड्रिवन।”
            </p>
            <button className="mt-8 bg-green-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-300 transform hover:scale-105">
                Explore Platform
            </button>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Platform Features</h2>
              <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Core modules powering the future of smart agriculture.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {modules.map((topic, index) => (
                <ModuleCard
                  key={index}
                  icon={topic.icon}
                  title={topic.title}
                  description={topic.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gray-100 dark:bg-gray-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Interactive Farm Map</h2>
              <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Visualize farm data, monitor crop health, and manage resources in real-time.</p>
            </div>
            <div className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
               <InteractiveMap location={location} />
               <div className="absolute top-4 right-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-3 rounded-lg shadow-md text-xs z-[1000]">
                  <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Legend</h4>
                  <ul className="space-y-1">
                    <li className="font-semibold text-gray-800 dark:text-gray-200">Crops</li>
                    <li className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#fde68a] border border-[#fbbf24] mr-2"></span><span className="text-gray-700 dark:text-gray-300">Wheat</span></li>
                    <li className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#86efac] border border-[#22c55e] mr-2"></span><span className="text-gray-700 dark:text-gray-300">Corn</span></li>
                    <li className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#fed7aa] border border-[#f97316] mr-2"></span><span className="text-gray-700 dark:text-gray-300">Soybean</span></li>
                    <li className="flex items-center"><span className="w-3 h-3 rounded-sm bg-[#d8b4fe] border border-[#a855f7] mr-2"></span><span className="text-gray-700 dark:text-gray-300">Vineyard</span></li>
                    <li className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Resources</li>
                     <li className="flex items-center"><WaterSourceIcon className="w-4 h-4 text-blue-500 mr-2" /><span className="text-gray-700 dark:text-gray-300">Water Source</span></li>
                    <li className="flex items-center"><WeatherStationIcon className="w-4 h-4 text-slate-600 mr-2" /><span className="text-gray-700 dark:text-gray-300">Weather Station</span></li>
                  </ul>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Weather & Climate Insights</h2>
                    <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Real-time data for proactive farm management.</p>
                </div>
                { locationError ? 
                    <div className="text-center p-8 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">{locationError}</div> 
                    : <Weather location={location} /> 
                }
            </div>
        </section>

      </main>
      <Footer />

      <div className="fixed bottom-6 right-6 z-50">
          <button 
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform duration-200 transform hover:scale-110"
              aria-label="Open GeoAI Assistant"
          >
              <BotIcon className="h-8 w-8" />
          </button>
      </div>

      <GeoAIAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        userLocation={location}
      />
    </div>
  );
};

export default App;
