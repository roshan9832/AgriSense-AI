
import React from 'react';
import { QuoteIcon, LeafIcon, RupeeIcon, LightbulbIcon } from './Icons';
import Button from './common/Button';

interface EmpathyPageProps {
    onStart: () => void;
}

const EmpathyPage: React.FC<EmpathyPageProps> = ({ onStart }) => {
    return (
        <div className="w-full h-full bg-green-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col p-6 items-center text-center justify-between">
            
            <div className="w-full">
                <header className="pt-8">
                    <h1 className="text-3xl font-bold text-green-800 dark:text-green-300">नमस्ते किसान भाई</h1>
                    <p className="text-md text-gray-600 dark:text-gray-400 mt-2">AgriSense AI में आपका स्वागत है</p>
                </header>

                <main className="mt-8 space-y-6">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <QuoteIcon className="w-8 h-8 text-green-600 mx-auto mb-2 opacity-50"/>
                        <p className="text-lg italic font-medium text-gray-700 dark:text-gray-300">"उत्तम खेती, मध्यम बान, निकृष्ट चाकरी, भीख निदान"</p>
                    </div>

                    <p className="text-md text-gray-700 dark:text-gray-300">
                        हम समझते हैं कि खेती केवल एक पेशा नहीं, बल्कि एक तपस्या है। आपकी मेहनत और लगन ही पूरे देश का पेट भरती है। AgriSense AI आपकी इसी मेहनत में आपका साथ देने आया है।
                    </p>

                    <div className="text-left bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center">
                            <LeafIcon className="w-6 h-6 text-green-500 mr-3"/>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">ज़्यादा पैदावार</span>
                        </div>
                        <div className="flex items-center">
                            <RupeeIcon className="w-6 h-6 text-green-500 mr-3"/>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">बढ़ा हुआ मुनाफा</span>
                        </div>
                         <div className="flex items-center">
                            <LightbulbIcon className="w-6 h-6 text-yellow-400 mr-3"/>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">सही समय पर सही सलाह</span>
                        </div>
                    </div>
                </main>
            </div>
            
            <div className="w-full max-w-sm pb-4">
                <Button onClick={onStart} variant="primary" size="lg" className="w-full shadow-lg">
                    चलिए, शुरू करें!
                </Button>
            </div>

        </div>
    );
};

export default EmpathyPage;
