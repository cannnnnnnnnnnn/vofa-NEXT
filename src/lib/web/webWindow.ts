/**
 * Web 端窗口 API - 替代 Tauri webviewWindow API
 */

/**
 * 获取当前窗口实例
 */
export function getCurrentWebviewWindow(): WebviewWindow {
  return new WebviewWindow('main');
}

/**
 * WebviewWindow 类
 */
export class WebviewWindow {
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * 最小化窗口（Web 端不支持）
   */
  async minimize(): Promise<void> {
    console.warn('minimize not supported on web');
  }

  /**
   * 最大化窗口（Web 端不支持）
   */
  async maximize(): Promise<void> {
    console.warn('maximize not supported on web');
  }

  /**
   * 取消最大化（Web 端不支持）
   */
  async unmaximize(): Promise<void> {
    console.warn('unmaximize not supported on web');
  }

  /**
   * 关闭窗口（Web 端只能关闭标签页）
   */
  async close(): Promise<void> {
    if (confirm('Close this tab?')) {
      window.close();
    }
  }

  /**
   * 显示窗口
   */
  async show(): Promise<void> {
    // Web 端窗口始终可见
  }

  /**
   * 隐藏窗口（Web 端不支持）
   */
  async hide(): Promise<void> {
    console.warn('hide not supported on web');
  }

  /**
   * 设置焦点
   */
  async setFocus(): Promise<void> {
    window.focus();
  }

  /**
   * 设置标题
   */
  async setTitle(title: string): Promise<void> {
    document.title = title;
  }

  /**
   * 获取是否最大化（Web 端始终返回 false）
   */
  async isMaximized(): Promise<boolean> {
    return false;
  }

  /**
   * 获取是否最小化（Web 端始终返回 false）
   */
  async isMinimized(): Promise<boolean> {
    return false;
  }

  /**
   * 获取是否全屏（Web 端检查 fullscreen API）
   */
  async isFullscreen(): Promise<boolean> {
    return document.fullscreenElement !== null;
  }

  /**
   * 进入全屏
   */
  async setFullscreen(fullscreen: boolean): Promise<void> {
    if (fullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  /**
   * 监听事件
   */
  on(event: string, handler: () => void): () => void {
    // 简化实现
    return () => {};
  }
}

/**
 * 获取所有窗口
 */
export async function getAllWindows(): Promise<WebviewWindow[]> {
  return [getCurrentWebviewWindow()];
}
