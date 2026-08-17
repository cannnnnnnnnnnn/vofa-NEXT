/**
 * Web 端事件系统 - 替代 Tauri event listen
 */

type EventCallback<T> = (payload: T) => void;

interface EventListener<T> {
  callback: EventCallback<T>;
  once?: boolean;
}

/**
 * 简单的事件发射器
 */
export class EventEmitter {
  private listeners: Map<string, Array<EventListener<any>>> = new Map();

  /**
   * 监听事件
   */
  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener: EventListener<T> = { callback };
    this.listeners.get(event)!.push(listener);

    // 返回取消监听函数
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 监听一次事件
   */
  once<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener: EventListener<T> = { callback, once: true };
    this.listeners.get(event)!.push(listener);

    // 返回取消监听函数
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(listener);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 触发事件
   */
  emit<T>(event: string, payload: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    // 复制一份，防止回调中修改 listeners
    const listenersToCall = [...eventListeners];

    for (const listener of listenersToCall) {
      try {
        listener.callback(payload);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }

    // 移除 once 监听器
    const remainingListeners = eventListeners.filter((l) => !l.once);
    if (remainingListeners.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, remainingListeners);
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

// 全局事件发射器
export const globalEmitter = new EventEmitter();

/**
 * 监听事件（兼容 Tauri API）
 */
export async function listen<T>(
  event: string,
  callback: EventCallback<T>
): Promise<() => void> {
  return globalEmitter.on(event, callback);
}

/**
 * 监听一次事件（兼容 Tauri API）
 */
export async function once<T>(
  event: string,
  callback: EventCallback<T>
): Promise<() => void> {
  return globalEmitter.once(event, callback);
}

/**
 * 触发事件（兼容 Tauri API）
 */
export async function emit<T>(event: string, payload?: T): Promise<void> {
  globalEmitter.emit(event, payload);
}

export type UnlistenFn = () => void;
