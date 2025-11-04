import React, { useState } from 'react';
import { AgriSenseLogo } from './Icons';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [locationEnabled, setLocationEnabled] = useState(true);

    return (
        <div className="w-full h-full bg-green-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col p-6 pt-12 items-center text-center">
            <AgriSenseLogo className="w-20 h-20 text-green-600 mb-2" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-300">AgriSense AI</h1>
            <h2 className="text-md font-medium text-green-700 dark:text-green-400">कृषि की बुद्धिमत्ता</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-8">AI and Geospatial data for a sustainable future</p>

            <div className="w-full max-w-sm space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Onboarding/Login Page</h3>
                <button className="w-full bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-semibold py-3 rounded-lg shadow-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 active:scale-95">
                    गुंजर रेसत्ततान (किसान)
                </button>
                <button className="w-full bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-semibold py-3 rounded-lg shadow-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 active:scale-95">
                    गुंजर रेसत्ततान (शोधकर्ता / गयरी)
                </button>
            </div>

            <div className="w-full max-w-sm mt-6 space-y-4">
                 <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>भाषा चुनें (Hindi / English)</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">हिंदी</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>Location Permission</span>
                    <div 
                        onClick={() => setLocationEnabled(!locationEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${locationEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${locationEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm mt-8 space-y-3">
                 <button onClick={onLogin} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 active:scale-95">
                    लागीन करें (OTP)
                </button>
                 <button className="w-full bg-transparent border border-green-600 text-green-600 font-bold py-3 rounded-lg hover:bg-green-600/10 transition-all duration-200 active:scale-95">
                    साइन अप करें (ऍम)
                </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 mt-auto">
                AI Use: Personalized recomendations on first login.
            </p>
        </div>
    );
};

export default Login;
