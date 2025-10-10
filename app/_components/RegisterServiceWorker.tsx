'use client';

import { useEffect } from 'react';

/**
 * 注册 Service Worker 组件
 * 仅在生产环境激活，开发环境跳过
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    // 注册 Service Worker
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/'
      })
      .then(registration => {
        console.log('[SW] Registered successfully:', registration.scope);

        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available, refresh to update');
              
              // 可选：提示用户刷新页面
              if (confirm('发现新版本，是否刷新页面？')) {
                window.location.reload();
              }
            }
          });
        });

        // 检查更新（每小时）
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        console.error('[SW] Registration failed:', error);
      });

    // 监听 Service Worker 控制器变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading');
      window.location.reload();
    });
  }, []);

  return null;
}

