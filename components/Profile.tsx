import React, { useState } from 'react';
import { ChatIcon, PlusIcon, UserIcon } from './Icons';
import ToggleSwitch from './ToggleSwitch';

interface ProfileProps {
    setPage: (page: 'Chat') => void;
}


const Profile: React.FC<ProfileProps> = ({ setPage }) => {
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="h-full bg-green-600 text-white">
            <div className="p-6 pt-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-green-500 border-4 border-green-400 flex items-center justify-center mb-3">
                    <UserIcon className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold">Farmer Name</h2>
                <p className="text-green-200">Darbhanga, Bihar</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-t-3xl p-6 text-gray-800 dark:text-gray-200 h-full space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-2">Farm Details</h3>
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <span>Crop Preferences</span>
                        <button className="text-green-600 hover:scale-110 transition-transform"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                     <h3 className="font-semibold mb-2">My Reports</h3>
                     <button className="w-full text-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold py-2.5 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200 active:scale-95">
                        Download All (PDF / CSV)
                    </button>
                </div>
                
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-2">Notification & Subscription Plans</h3>
                     <div className="p-2 -my-1">
                        <ToggleSwitch id="notifications-toggle" label="Notifications" enabled={notifications} setEnabled={setNotifications} />
                     </div>
                     <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <span>Subscription Tier</span>
                        <span className="font-semibold text-green-600">Basic (Free) &gt;</span>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={() => setPage('Chat')}
                        className="w-full flex flex-col items-center justify-center bg-green-50 dark:bg-gray-800 p-6 rounded-xl shadow-inner-lg text-center transition-all duration-300 hover:bg-green-100 dark:hover:bg-gray-700 hover:shadow-lg hover:-translate-y-1"
                    >
                        <ChatIcon className="w-10 h-10 text-green-600 mb-2" />
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">AI Chat Assistant</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything about your farm</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
