/**
 * 环境感知 API 模块
 * 
 * 自动检测运行环境（Tauri 或 Web），并提供统一的 API 接口。
 * 在 Tauri 环境中使用原生 API，在 Web 环境中使用浏览器 API。
 */

import { isWebMode } from './web';

// 延迟导入 Tauri API，避免在 Web 环境中报错
let tauriApi: any = null;
let webApiInstance: any = null;

/**
 * 获取当前环境的 API 实例
 */
function getApi() {
  if (isWebMode()) {
    if (!webApiInstance) {
      // 动态导入 Web API
      webApiInstance = require('./web/webApi').webApi;
    }
    return webApiInstance;
  } else {
    if (!tauriApi) {
      // 动态导入 Tauri API
      tauriApi = require('./tauri/tauri').api;
    }
    return tauriApi;
  }
}

/**
 * 通用 invoke 函数
 * 自动根据环境调用对应的 API
 */
export async function invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T> {
  const api = getApi();
  if (isWebMode()) {
    // Web 环境：调用 webApi 对应的方法
    const method = (api as any)[cmd];
    if (typeof method === 'function') {
      return method.call(api, ...(args ? Object.values(args) : []));
    }
    throw new Error(`Method ${cmd} not implemented in Web mode`);
  } else {
    // Tauri 环境：使用 invoke
    const { invoke: tauriInvoke } = require('@tauri-apps/api/core');
    return tauriInvoke(cmd, args);
  }
}

/**
 * Channel - 用于流式数据传输
 */
export const Channel = isWebMode() 
  ? require('./web/webApi').Channel || class WebChannel {}
  : require('@tauri-apps/api/core').Channel;

/**
 * 事件监听
 */
export async function listen<T>(event: string, handler: (event: any) => void) {
  if (isWebMode()) {
    const { listen: webListen } = require('./web/webEvents');
    return webListen(event, handler);
  } else {
    const { listen: tauriListen } = require('@tauri-apps/api/event');
    return tauriListen(event, handler);
  }
}

/**
 * 一次性事件监听
 */
export async function once<T>(event: string, handler: (event: any) => void) {
  if (isWebMode()) {
    const { once: webOnce } = require('./web/webEvents');
    return webOnce(event, handler);
  } else {
    const { once: tauriOnce } = require('@tauri-apps/api/event');
    return tauriOnce(event, handler);
  }
}

/**
 * 发送事件
 */
export async function emit(event: string, payload?: any) {
  if (isWebMode()) {
    const { emit: webEmit } = require('./web/webEvents');
    return webEmit(event, payload);
  } else {
    const { emit: tauriEmit } = require('@tauri-apps/api/event');
    return tauriEmit(event, payload);
  }
}

/**
 * 应用信息
 */
export async function getName(): Promise<string> {
  if (isWebMode()) {
    const { getName: webGetName } = require('./web/webApp');
    return webGetName();
  } else {
    const { getName: tauriGetName } = require('@tauri-apps/api/app');
    return tauriGetName();
  }
}

export async function getVersion(): Promise<string> {
  if (isWebMode()) {
    const { getVersion: webGetVersion } = require('./web/webApp');
    return webGetVersion();
  } else {
    const { getVersion: tauriGetVersion } = require('@tauri-apps/api/app');
    return tauriGetVersion();
  }
}

export async function getTauriVersion(): Promise<string | null> {
  if (isWebMode()) {
    const { getTauriVersion: webGetTauriVersion } = require('./web/webApp');
    return webGetTauriVersion();
  } else {
    const { getTauriVersion: tauriGetTauriVersion } = require('@tauri-apps/api/app');
    return tauriGetTauriVersion();
  }
}

/**
 * 对话框
 */
export const dialog = {
  async open(options?: any) {
    if (isWebMode()) {
      const { open } = require('./web/webDialog');
      return open(options);
    } else {
      const { open } = require('@tauri-apps/plugin-dialog');
      return open(options);
    }
  },
  
  async save(options?: any) {
    if (isWebMode()) {
      const { save } = require('./web/webDialog');
      return save(options);
    } else {
      const { save } = require('@tauri-apps/plugin-dialog');
      return save(options);
    }
  },
  
  async message(message: string, options?: any) {
    if (isWebMode()) {
      const { message } = require('./web/webDialog');
      return message(message, options);
    } else {
      const { message } = require('@tauri-apps/plugin-dialog');
      return message(message, options);
    }
  },
  
  async ask(message: string, options?: any) {
    if (isWebMode()) {
      const { ask } = require('./web/webDialog');
      return ask(message, options);
    } else {
      const { ask } = require('@tauri-apps/plugin-dialog');
      return ask(message, options);
    }
  },
  
  async confirm(message: string, options?: any) {
    if (isWebMode()) {
      const { confirm } = require('./web/webDialog');
      return confirm(message, options);
    } else {
      const { confirm } = require('@tauri-apps/plugin-dialog');
      return confirm(message, options);
    }
  },
};

/**
 * 文件系统
 */
export const fs = {
  async readTextFile(path: string, options?: any) {
    if (isWebMode()) {
      const { readTextFile } = require('./web/webFs');
      return readTextFile(path, options);
    } else {
      const { readTextFile } = require('@tauri-apps/plugin-fs');
      return readTextFile(path, options);
    }
  },
  
  async writeTextFile(path: string, contents: string, options?: any) {
    if (isWebMode()) {
      const { writeTextFile } = require('./web/webFs');
      return writeTextFile(path, contents, options);
    } else {
      const { writeTextFile } = require('@tauri-apps/plugin-fs');
      return writeTextFile(path, contents, options);
    }
  },
  
  async readBinaryFile(path: string, options?: any) {
    if (isWebMode()) {
      const { readBinaryFile } = require('./web/webFs');
      return readBinaryFile(path, options);
    } else {
      const { readBinaryFile } = require('@tauri-apps/plugin-fs');
      return readBinaryFile(path, options);
    }
  },
  
  async writeBinaryFile(path: string, data: Uint8Array, options?: any) {
    if (isWebMode()) {
      const { writeBinaryFile } = require('./web/webFs');
      return writeBinaryFile(path, data, options);
    } else {
      const { writeBinaryFile } = require('@tauri-apps/plugin-fs');
      return writeBinaryFile(path, data, options);
    }
  },
  
  async exists(path: string) {
    if (isWebMode()) {
      const { exists } = require('./web/webFs');
      return exists(path);
    } else {
      const { exists } = require('@tauri-apps/plugin-fs');
      return exists(path);
    }
  },
  
  async mkdir(path: string, options?: any) {
    if (isWebMode()) {
      const { mkdir } = require('./web/webFs');
      return mkdir(path, options);
    } else {
      const { mkdir } = require('@tauri-apps/plugin-fs');
      return mkdir(path, options);
    }
  },
  
  async remove(path: string, options?: any) {
    if (isWebMode()) {
      const { remove } = require('./web/webFs');
      return remove(path, options);
    } else {
      const { remove } = require('@tauri-apps/plugin-fs');
      return remove(path, options);
    }
  },
  
  async rename(oldPath: string, newPath: string) {
    if (isWebMode()) {
      const { rename } = require('./web/webFs');
      return rename(oldPath, newPath);
    } else {
      const { rename } = require('@tauri-apps/plugin-fs');
      return rename(oldPath, newPath);
    }
  },
  
  async copy(src: string, dest: string) {
    if (isWebMode()) {
      const { copy } = require('./web/webFs');
      return copy(src, dest);
    } else {
      const { copy } = require('@tauri-apps/plugin-fs');
      return copy(src, dest);
    }
  },
  
  async readDir(path: string, options?: any) {
    if (isWebMode()) {
      const { readDir } = require('./web/webFs');
      return readDir(path, options);
    } else {
      const { readDir } = require('@tauri-apps/plugin-fs');
      return readDir(path, options);
    }
  },
  
  async stat(path: string) {
    if (isWebMode()) {
      const { stat } = require('./web/webFs');
      return stat(path);
    } else {
      const { stat } = require('@tauri-apps/plugin-fs');
      return stat(path);
    }
  },
};

/**
 * 进程控制
 */
export const process = {
  async exit(code?: number) {
    if (isWebMode()) {
      const { exit } = require('./web/webProcess');
      return exit(code);
    } else {
      const { exit } = require('@tauri-apps/plugin-process');
      return exit(code);
    }
  },
  
  async relaunch() {
    if (isWebMode()) {
      const { relaunch } = require('./web/webProcess');
      return relaunch();
    } else {
      const { relaunch } = require('@tauri-apps/plugin-process');
      return relaunch();
    }
  },
};

/**
 * 打开 URL
 */
export async function openUrl(url: string) {
  if (isWebMode()) {
    const { openUrl } = require('./web/webOpener');
    return openUrl(url);
  } else {
    const { openUrl } = require('@tauri-apps/plugin-opener');
    return openUrl(url);
  }
}

export async function openPath(path: string) {
  if (isWebMode()) {
    const { openPath } = require('./web/webOpener');
    return openPath(path);
  } else {
    const { openPath } = require('@tauri-apps/plugin-opener');
    return openPath(path);
  }
}

/**
 * 窗口管理
 */
export const window = {
  getCurrentWebviewWindow() {
    if (isWebMode()) {
      const { getCurrentWebviewWindow } = require('./web/webWindow');
      return getCurrentWebviewWindow();
    } else {
      const { getCurrentWebviewWindow } = require('@tauri-apps/api/webviewWindow');
      return getCurrentWebviewWindow();
    }
  },
  
  WebviewWindow: isWebMode()
    ? require('./web/webWindow').WebviewWindow
    : require('@tauri-apps/api/webviewWindow').WebviewWindow,
  
  async getAllWindows() {
    if (isWebMode()) {
      const { getAllWindows } = require('./web/webWindow');
      return getAllWindows();
    } else {
      const { getAllWindows } = require('@tauri-apps/api/webviewWindow');
      return getAllWindows();
    }
  },
};

/**
 * 更新器
 */
export const updater = {
  async check() {
    if (isWebMode()) {
      const { check } = require('./web/webUpdater');
      return check();
    } else {
      const { check } = require('@tauri-apps/plugin-updater');
      return check();
    }
  },
  
  async downloadAndInstall() {
    if (isWebMode()) {
      const { downloadAndInstall } = require('./web/webUpdater');
      return downloadAndInstall();
    } else {
      const { downloadAndInstall } = require('@tauri-apps/plugin-updater');
      return downloadAndInstall();
    }
  },
};

/**
 * 存储 (LazyStore)
 */
export class LazyStore {
  private store: any;
  
  constructor(path: string, options?: any) {
    if (isWebMode()) {
      const { LazyStore: WebLazyStore } = require('./web/webStorage');
      this.store = new WebLazyStore(path, options);
    } else {
      const { LazyStore: TauriLazyStore } = require('@tauri-apps/plugin-store');
      this.store = new TauriLazyStore(path, options);
    }
  }
  
  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }
  
  async set(key: string, value: any): Promise<void> {
    return this.store.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    return this.store.delete(key);
  }
  
  async clear(): Promise<void> {
    return this.store.clear();
  }
  
  async keys(): Promise<string[]> {
    return this.store.keys();
  }
  
  async size(): Promise<number> {
    return this.store.size();
  }
  
  async load(): Promise<void> {
    return this.store.load();
  }
  
  async save(): Promise<void> {
    return this.store.save();
  }
}

// 导出环境检测函数
export { isWebMode, getRuntimeEnvironment, initWebAdapter } from './web';

// 导出类型
export type { PipelineConfig } from './web/webApi';
