
import React from 'react';
import { AgriSenseLogo } from './Icons';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
      <AgriSenseLogo className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">{title}</h2>
      <p className="max-w-xs">This page is under construction. Check back soon for exciting new features!</p>
    </div>
  );
};

export default PlaceholderPage;
