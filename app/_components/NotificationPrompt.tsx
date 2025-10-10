'use client';

import { useEffect, useState } from 'react';
import { 
  getNotificationPermission, 
  enablePushNotifications,
  isPushSupported 
} from '@/src/lib/pwa/push-notifications';

/**
 * 推送通知权限请求组件
 * 引导用户开启推送通知
 */
export default function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      return;
    }

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // 如果还没请求过，延迟显示提示
    if (currentPermission === 'default') {
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 15000); // 15秒后显示
      }
    }
  }, []);

  const handleEnable = async () => {
    if (!isPushSupported()) {
      alert('您的浏览器不支持推送通知');
      return;
    }

    setLoading(true);

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Push] VAPID key not configured');
        alert('推送通知未配置，请联系管理员');
        setLoading(false);
        return;
      }

      const result = await enablePushNotifications(vapidKey);

      if (result.success) {
        setPermission('granted');
        setShowPrompt(false);
        alert('✅ 推送通知已开启！');
      } else {
        alert('❌ 开启失败：' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('[Push] Enable failed:', error);
      alert('开启失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (permission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white shadow-2xl rounded-2xl p-4 sm:p-5 z-50 border border-gray-200 animate-slide-down">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">
            开启通知
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            接收剧本审核结果、评论回复等重要通知，不错过任何消息
          </p>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-h-touch"
            >
              {loading ? '开启中...' : '开启通知'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors min-h-touch"
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

