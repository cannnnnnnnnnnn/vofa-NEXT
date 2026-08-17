/**
 * Web 端通知系统 - 替代 Tauri plugin-notification
 * 使用浏览器原生 Notification API
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class WebNotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
  }

  /**
   * 检查通知权限
   */
  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    } else {
      console.warn('Notifications not supported in this browser');
      this.permission = 'denied';
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      this.permission = 'denied';
      return false;
    }
  }

  /**
   * 发送通知
   */
  async send(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported, showing toast instead');
      this.showToast(options);
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        this.showToast(options);
        return;
      }
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.showToast(options);
    }
  }

  /**
   * 显示 Toast 提示（作为通知的降级方案）
   */
  private showToast(options: NotificationOptions): void {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: #333;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '4px';
    title.textContent = options.title;

    const body = document.createElement('div');
    body.style.fontSize = '14px';
    body.style.opacity = '0.9';
    body.textContent = options.body;

    toast.appendChild(title);
    toast.appendChild(body);
    document.body.appendChild(toast);

    // 自动移除
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }
}

// 导出单例
export const webNotification = new WebNotificationManager();

/**
 * 便捷函数：发送通知
 */
export async function notify(
  title: string,
  body: string,
  options?: Omit<NotificationOptions, 'title' | 'body'>
): Promise<void> {
  await webNotification.send({
    title,
    body,
    ...options,
  });
}

/**
 * 格式化错误消息
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}
