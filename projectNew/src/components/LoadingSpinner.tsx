import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="w-full h-full border-3 border-blue-200 dark:border-blue-800 rounded-full">
          <div className="w-full h-full border-3 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
        {message}
      </p>
    </div>
  );
}