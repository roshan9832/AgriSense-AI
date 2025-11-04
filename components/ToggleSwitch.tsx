import React from 'react';

interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, setEnabled, id }) => {
    return (
        <div className="flex justify-between items-center">
            <label htmlFor={id} className="font-medium text-gray-700 dark:text-gray-200 mr-4 cursor-pointer">{label}</label>
            <button
                id={id}
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                role="switch"
                aria-checked={enabled}
            >
                <span className="sr-only">{label}</span>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : ''}`}></div>
            </button>
        </div>
    );
};

export default ToggleSwitch;
