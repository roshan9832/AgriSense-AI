
import React, { useState } from 'react';
import { AgriSenseLogo } from './Icons';
import Button from './common/Button';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [locationEnabled, setLocationEnabled] = useState(true);

    return (
        <div className="w-full h-full bg-green-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col p-6 pt-12 items-center text-center">
            <AgriSenseLogo className="w-20 h-20 text-green-600 mb-2" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-300">AgriSense AI</h1>
            <h2 className="text-md font-medium text-green-700 dark:text-green-400">The Intelligence of Agriculture</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-8">AI and Geospatial data for a sustainable future</p>

            <div className="w-full max-w-sm space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Onboarding / Login</h3>
                <Button variant="outline" className="w-full bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 shadow-sm" size="md">
                    Login / Register (Farmer)
                </Button>
                <Button variant="outline" className="w-full bg-white dark:bg-gray-800 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 shadow-sm" size="md">
                    Login / Register (Researcher)
                </Button>
            </div>

            <div className="w-full max-w-sm mt-6 space-y-4">
                 <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>Select Language</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">English</span>
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
                 <Button onClick={onLogin} variant="primary" className="w-full" size="md">
                    Login with OTP
                </Button>
                 <Button variant="outline" className="w-full" size="md">
                    Sign Up with Email
                </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 mt-auto">
                AI Use: Personalized recomendations on first login.
            </p>
        </div>
    );
};

export default Login;