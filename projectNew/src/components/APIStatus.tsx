import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';

export function APIStatus() {
  const { status } = useAPI();

  const getStatusIcon = () => {
    switch (status.status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'online':
        return 'API Online';
      case 'offline':
        return 'API Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
      {getStatusIcon()}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {getStatusText()}
      </span>
    </div>
  );
}