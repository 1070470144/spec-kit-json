/**
 * IndexedDB 离线队列管理
 * 
 * 用于存储离线时的用户操作（点赞、收藏、评论），
 * 网络恢复后自动同步到服务器
 */

export type ActionType = 'like' | 'favorite' | 'comment';
export type ActionStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface OfflineAction {
  id: string;
  type: ActionType;
  action: 'add' | 'remove' | 'create';
  data: {
    scriptId?: string;
    commentId?: string;
    content?: string;
    [key: string]: any;
  };
  timestamp: number;
  retries: number;
  status: ActionStatus;
  error?: string;
}

const DB_NAME = 'offline-queue-db';
const DB_VERSION = 1;
const STORE_NAME = 'actions';

/**
 * IndexedDB 离线队列管理器
 */
export class OfflineQueue {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * 初始化数据库
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // 创建索引
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * 添加操作到队列
   */
  async enqueue(
    type: ActionType,
    action: 'add' | 'remove' | 'create',
    data: OfflineAction['data']
  ): Promise<string> {
    const db = await this.getDB();
    
    const id = `${type}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineAction: OfflineAction = {
      id,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(offlineAction);

      request.onsuccess = () => {
        console.log('[Queue] Enqueued:', id);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有待处理的操作
   */
  async getPending(): Promise<OfflineAction[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有操作（包括已完成和失败）
   */
  async getAll(): Promise<OfflineAction[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新操作状态
   */
  async updateStatus(
    id: string,
    status: ActionStatus,
    error?: string
  ): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result as OfflineAction;
        if (!action) {
          reject(new Error(`Action ${id} not found`));
          return;
        }

        action.status = status;
        if (error) {
          action.error = error;
        }
        if (status === 'failed') {
          action.retries++;
        }

        const updateRequest = store.put(action);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * 标记为已同步并删除
   */
  async markSynced(id: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[Queue] Synced and removed:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 标记为失败
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.updateStatus(id, 'failed', error);
  }

  /**
   * 清空队列
   */
  async clear(): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[Queue] Cleared all actions');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除指定操作
   */
  async delete(id: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取队列统计信息
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    failed: number;
  }> {
    const all = await this.getAll();
    
    return {
      total: all.length,
      pending: all.filter(a => a.status === 'pending').length,
      syncing: all.filter(a => a.status === 'syncing').length,
      failed: all.filter(a => a.status === 'failed').length
    };
  }
}

// 单例实例
let queueInstance: OfflineQueue | null = null;

/**
 * 获取队列单例
 */
export function getOfflineQueue(): OfflineQueue {
  if (!queueInstance) {
    queueInstance = new OfflineQueue();
  }
  return queueInstance;
}

