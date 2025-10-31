import React from 'react';
import { SafeStorage } from '../utils/SafeStorage';

const StorageIndicator: React.FC = () => {
  const [usage, setUsage] = React.useState({ used: 0, total: 0, percentage: 0 });

  React.useEffect(() => {
    const updateUsage = () => {
      const usageInfo = SafeStorage.getUsageInfo();
      setUsage(prevUsage => {
        // Only update if there's a significant change to prevent constant re-renders
        if (Math.abs(prevUsage.percentage - usageInfo.percentage) > 5) {
          return usageInfo;
        }
        return prevUsage;
      });
    };

    updateUsage();
    const interval = setInterval(updateUsage, 10000); // Update every 10 seconds instead of 5

    return () => clearInterval(interval);
  }, []);

  if (usage.percentage < 70) {
    return null; // Don't show if storage usage is low
  }

  const getColor = () => {
    if (usage.percentage >= 90) return 'bg-red-500';
    if (usage.percentage >= 80) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getWidthClass = () => {
    const percentage = Math.min(usage.percentage, 100);
    if (percentage >= 95) return 'w-full';
    if (percentage >= 90) return 'w-11/12';
    if (percentage >= 80) return 'w-4/5';
    if (percentage >= 70) return 'w-3/4';
    if (percentage >= 60) return 'w-3/5';
    if (percentage >= 50) return 'w-1/2';
    if (percentage >= 40) return 'w-2/5';
    if (percentage >= 30) return 'w-1/3';
    if (percentage >= 25) return 'w-1/4';
    if (percentage >= 20) return 'w-1/5';
    return 'w-1/6';
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm max-w-xs z-50">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <span className="font-medium text-gray-800 dark:text-white">Storage Usage</span>
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getColor()} transition-all duration-300 ${getWidthClass()}`}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          {formatBytes(usage.used)} / {formatBytes(usage.total)} ({usage.percentage.toFixed(1)}%)
        </div>
        {usage.percentage >= 90 && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
            Storage almost full! Old data will be automatically cleaned.
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageIndicator;