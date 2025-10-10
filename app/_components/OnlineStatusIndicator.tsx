'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';

/**
 * 在线状态指示器
 * 当离线时显示警告
 * 
 * 注意：添加了 mounted 检查，避免 SSR/CSR 不匹配导致误报
 */
export default function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  // 等待组件挂载后再显示，避免 SSR 闪烁
  useEffect(() => {
    setMounted(true);
  }, []);

  // 离线状态延迟显示，避免误报
  useEffect(() => {
    if (!mounted) return;

    if (!isOnline) {
      // 延迟1秒确认真的离线（避免网络波动误报）
      const timer = setTimeout(() => {
        setShowOffline(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowOffline(false);
    }
  }, [isOnline, mounted]);

  // 未挂载或在线时不显示
  if (!mounted || !showOffline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center z-40 shadow-lg">
      <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="font-medium">离线状态 - 部分功能不可用</span>
      </div>
    </div>
  );
}

