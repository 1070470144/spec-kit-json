/**
 * Web Push 推送通知客户端逻辑
 * 
 * 实现推送通知的订阅、取消订阅和权限管理
 */

/**
 * 检查浏览器是否支持推送通知
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * 获取当前通知权限状态
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission denied');
  }

  // 请求权限
  const permission = await Notification.requestPermission();
  console.log('[Push] Permission:', permission);
  
  return permission;
}

/**
 * 将 VAPID 公钥从 base64 转换为 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * 订阅推送通知
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // 确保 Service Worker 已注册
  const registration = await navigator.serviceWorker.ready;

  // 检查是否已有订阅
  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    console.log('[Push] Already subscribed');
    return subscription;
  }

  // 创建新订阅
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,  // 必须显示通知
    applicationServerKey: applicationServerKey as BufferSource
  });

  console.log('[Push] Subscribed successfully');
  return subscription;
}

/**
 * 取消推送订阅
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] No active subscription');
      return false;
    }

    const successful = await subscription.unsubscribe();
    console.log('[Push] Unsubscribed:', successful);
    
    return successful;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * 获取当前订阅信息
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Get subscription failed:', error);
    return null;
  }
}

/**
 * 将订阅信息发送到后端
 */
export async function sendSubscriptionToBackend(
  subscription: PushSubscription
): Promise<{ success: boolean; subscriptionId?: string }> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription.toJSON())
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[Push] Subscription saved to backend:', data);
    
    return data;
  } catch (error) {
    console.error('[Push] Failed to send subscription to backend:', error);
    return { success: false };
  }
}

/**
 * 删除后端的订阅记录
 */
export async function removeSubscriptionFromBackend(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint })
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Failed to remove subscription from backend:', error);
    return false;
  }
}

/**
 * 完整的订阅流程（权限 + 订阅 + 发送到后端）
 */
export async function enablePushNotifications(
  vapidPublicKey: string
): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  try {
    // 1. 请求权限
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      return {
        success: false,
        error: 'Permission not granted'
      };
    }

    // 2. 订阅推送
    const subscription = await subscribeToPush(vapidPublicKey);

    // 3. 发送到后端
    const result = await sendSubscriptionToBackend(subscription);

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to save subscription to backend'
      };
    }

    return {
      success: true,
      subscription
    };
  } catch (error) {
    console.error('[Push] Enable failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 完整的取消订阅流程
 */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();
    
    if (!subscription) {
      return true; // 本来就没订阅
    }

    // 1. 从后端删除
    await removeSubscriptionFromBackend(subscription.endpoint);

    // 2. 取消浏览器订阅
    const unsubscribed = await unsubscribeFromPush();

    return unsubscribed;
  } catch (error) {
    console.error('[Push] Disable failed:', error);
    return false;
  }
}

/**
 * 显示本地通知（测试用）
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: 'local-notification',
    requireInteraction: false,
    ...options
  });
}

