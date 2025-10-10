'use client';

import { useEffect, useState } from 'react';

/**
 * PWA 安装提示组件
 * 引导用户将应用添加到主屏幕
 */
export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 检查是否已经在 standalone 模式（已安装）
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // 检查是否已经dismiss过
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // 监听安装提示事件
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // 延迟显示提示（用户访问一段时间后）
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // 10秒后显示
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    // 触发安装提示
    installPrompt.prompt();

    // 等待用户选择
    const { outcome } = await installPrompt.userChoice;

    console.log('[PWA] Install outcome:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted installation');
    } else {
      console.log('[PWA] User dismissed installation');
    }

    // 关闭提示
    setShowPrompt(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    setDismissed(true);
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white shadow-2xl rounded-2xl p-4 sm:p-5 z-50 border border-gray-200 animate-slide-up">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">
            安装应用
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            将血染钟楼添加到主屏幕，获得类原生应用体验，支持离线访问
          </p>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-600 rounded-lg hover:shadow-lg transition-all min-h-touch"
            >
              安装
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all min-h-touch"
            >
              暂不
            </button>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 min-w-touch min-h-touch p-1 text-gray-400 hover:text-gray-600 transition-colors -mr-2 -mt-1"
          aria-label="关闭"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

