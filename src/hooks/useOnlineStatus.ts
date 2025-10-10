'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * @returns boolean indicating if the browser is online
 * 
 * @example
 * const isOnline = useOnlineStatus();
 * if (!isOnline) {
 *   return <OfflineWarning />;
 * }
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    // Server-side rendering guard
    if (typeof navigator === 'undefined') {
      return true; // Assume online on server
    }
    return navigator.onLine;
  });

  useEffect(() => {
    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check as backup (some browsers don't fire events reliably)
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 30000); // Check every 30 seconds

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}

/**
 * Hook with callback support for online/offline transitions
 */
export interface OnlineStatusCallbacks {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOnlineStatusWithCallbacks(callbacks: OnlineStatusCallbacks = {}) {
  const isOnline = useOnlineStatus();
  const { onOnline, onOffline } = callbacks;

  useEffect(() => {
    if (isOnline && onOnline) {
      onOnline();
    } else if (!isOnline && onOffline) {
      onOffline();
    }
  }, [isOnline, onOnline, onOffline]);

  return isOnline;
}

/**
 * Hook to track connection quality (using Network Information API)
 * Note: Only supported in Chrome/Edge
 */
export interface ConnectionInfo {
  isOnline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;  // Mbps
  rtt?: number;       // Round trip time in ms
  saveData?: boolean; // User has enabled data saver
}

export function useConnectionInfo(): ConnectionInfo {
  const isOnline = useOnlineStatus();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    isOnline
  });

  useEffect(() => {
    // Check if Network Information API is supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      setConnectionInfo({ isOnline });
      return;
    }

    const updateConnectionInfo = () => {
      setConnectionInfo({
        isOnline,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
    };

    // Initial update
    updateConnectionInfo();

    // Listen for changes
    connection.addEventListener('change', updateConnectionInfo);

    return () => {
      connection.removeEventListener('change', updateConnectionInfo);
    };
  }, [isOnline]);

  return connectionInfo;
}

/**
 * Utility function to check if connection is slow
 */
export function useIsSlowConnection(): boolean {
  const connectionInfo = useConnectionInfo();
  
  if (!connectionInfo.effectiveType) {
    return false; // Can't determine, assume not slow
  }

  return connectionInfo.effectiveType === 'slow-2g' || 
         connectionInfo.effectiveType === '2g';
}

