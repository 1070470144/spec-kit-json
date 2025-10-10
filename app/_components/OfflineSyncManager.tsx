'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';
import { getOfflineQueue } from '@/src/lib/pwa/offline-queue';

/**
 * 离线同步管理组件
 * 在网络恢复时自动同步离线操作
 */
export default function OfflineSyncManager() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // 检查待同步数量
  useEffect(() => {
    const checkPending = async () => {
      try {
        const queue = getOfflineQueue();
        const stats = await queue.getStats();
        setPendingCount(stats.pending);
      } catch (error) {
        console.error('[Sync] Failed to get stats:', error);
      }
    };

    checkPending();

    // 定期检查
    const interval = setInterval(checkPending, 30000); // 每30秒
    return () => clearInterval(interval);
  }, []);

  // 网络恢复时自动同步
  useEffect(() => {
    if (!isOnline || pendingCount === 0 || syncing) {
      return;
    }

    const syncPending = async () => {
      setSyncing(true);

      try {
        const queue = getOfflineQueue();
        const pending = await queue.getPending();

        if (pending.length === 0) {
          setPendingCount(0);
          setSyncing(false);
          return;
        }

        console.log(`[Sync] Syncing ${pending.length} actions...`);

        // 批量同步
        const response = await fetch('/api/offline-sync/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actions: pending })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const results = result.results || [];

        // 更新队列
        for (let i = 0; i < pending.length; i++) {
          const action = pending[i];
          const syncResult = results[i];

          if (syncResult?.success) {
            await queue.markSynced(action.id);
          } else {
            await queue.markFailed(action.id, syncResult?.error || 'Unknown error');
          }
        }

        // 更新待同步数量
        const stats = await queue.getStats();
        setPendingCount(stats.pending);

        console.log('[Sync] Sync completed:', {
          success: results.filter((r: any) => r.success).length,
          failed: results.filter((r: any) => !r.success).length
        });
      } catch (error) {
        console.error('[Sync] Sync failed:', error);
      } finally {
        setSyncing(false);
      }
    };

    syncPending();
  }, [isOnline, pendingCount, syncing]);

  // 仅在有待同步且离线时显示指示器
  if (!isOnline && pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 shadow-lg z-40">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>离线状态，{pendingCount} 个操作待同步</span>
        </div>
      </div>
    );
  }

  // 同步中指示器
  if (syncing) {
    return (
      <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 shadow-lg z-40">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>正在同步...</span>
        </div>
      </div>
    );
  }

  return null;
}

