import React from 'react';
import { CameraIcon, LeafIcon, AlertIcon } from './Icons';

const CropHealth: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4">
                    <CameraIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    <span className="absolute bottom-3 text-sm text-gray-500 dark:text-gray-400">फोटो अपलोड करें या लिंक शेयर करें</span>
                </div>
                <div className="flex justify-center items-center space-x-4">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-600 p-1">
                        <img src="https://images.unsplash.com/photo-1598164074852-36b063126f64?q=80&w=200&auto=format&fit=crop" alt="Healthy leaf sample" className="rounded-full w-full h-full object-cover" />
                    </div>
                     <span className="text-gray-500 dark:text-gray-400">बनाम</span>
                     <div className="w-16 h-16 rounded-full border-2 border-red-400 dark:border-red-500 p-1">
                        <img src="https://images.unsplash.com/photo-1621043239339-3c355553e150?q=80&w=200&auto=format&fit=crop" alt="Diseased leaf sample" className="rounded-full w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <h3 className="font-bold text-lg mb-3 flex items-center text-gray-800 dark:text-gray-100">
                    <AlertIcon className="w-6 h-6 text-red-500 mr-2" />
                    रोग की पहचान: ब्लाइट
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <li>Linezolid PMAA DO*H</li>
                    <li>Pret pesticide PBUSTX DOME-I S.AOOT*W (free riot pesticide)</li>
                </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <h3 className="font-bold text-lg mb-3 flex items-center text-gray-800 dark:text-gray-100">
                   <LeafIcon className="w-5 h-5 text-green-500 mr-2" />
                    यूरिया + पोटाश
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                     <li>Prid pestcide s*a'im z Indazin I(Z"O teo)</li>
                </ul>
            </div>
        </div>
    );
};

export default CropHealth;
