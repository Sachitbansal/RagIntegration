import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import type { APIStatus } from '../types';

export function useAPI() {
  const [status, setStatus] = useState<APIStatus>({
    status: 'checking',
    lastChecked: new Date()
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, status: 'checking' }));
    
    try {
      const isOnline = await apiClient.checkHealth();
      setStatus({
        status: isOnline ? 'online' : 'offline',
        lastChecked: new Date()
      });
    } catch {
      setStatus({
        status: 'offline',
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return { status, checkStatus };
}