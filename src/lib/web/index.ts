/**
 * Web 适配层统一入口
 * 
 * 这个模块提供与 Tauri API 兼容的接口，使应用可以在纯 Web 环境中运行。
 * 
 * 功能覆盖:
 * - Web Serial API (串口通信)
 * - Web Storage (数据持久化)
 * - Web Notification (通知系统)
 * - Web Events (事件系统)
 * - 其他浏览器原生 API
 * 
 * 限制说明:
 * - TCP/UDP 需要 WebSocket 或 WebRTC
 * - CAN/CandleLight 需要原生后端
 * - 文件系统操作受限
 * - 窗口管理功能有限
 */

// 串口通信
export {
  WebSerialTransport,
  getAvailablePorts,
  requestSerialPort,
  type SerialPortInfo,
  type SerialOptions,
} from './webSerial';

// API 适配层
export { WebApi, webApi, type PipelineConfig } from './webApi';

// 存储
export {
  WebStorage,
  SettingsStore,
  LayoutStore,
  WidgetsStore,
  webStorage,
  settingsStore,
  layoutStore,
  widgetsStore,
  saveFile,
  openFile,
  readTextFile,
  writeTextFile,
} from './webStorage';

// 通知
export {
  WebNotificationManager,
  webNotification,
  notify,
  formatError,
  type NotificationOptions,
} from './webNotification';

// 事件
export {
  EventEmitter,
  globalEmitter,
  listen,
  once,
  emit,
  globalEmitter as eventEmitter,
  type UnlistenFn,
} from './webEvents';

// 应用信息
export { getName, getVersion, getTauriVersion } from './webApp';

// 进程
export { exit, relaunch } from './webProcess';

// 打开 URL
export { openUrl, openPath } from './webOpener';

// 对话框
export { open, save, message, ask, confirm } from './webDialog';

// 文件系统
export {
  readTextFile as fsReadTextFile,
  writeTextFile as fsWriteTextFile,
  readBinaryFile,
  writeBinaryFile,
  exists,
  mkdir,
  remove,
  rename,
  copy,
  readDir,
  stat,
  appDataDir,
  documentDir,
  downloadDir,
} from './webFs';

// 更新器
export { check, downloadAndInstall, checkUpdate, onUpdateAvailable } from './webUpdater';

// 窗口
export {
  getCurrentWebviewWindow,
  WebviewWindow,
  getAllWindows,
} from './webWindow';

/**
 * 检测是否在 Web 环境运行
 */
export function isWebMode(): boolean {
  // 检查是否在 Tauri 环境中
  return !('__TAURI_INTERNALS__' in window);
}

/**
 * 获取当前运行环境
 */
export function getRuntimeEnvironment(): 'tauri' | 'web' {
  return isWebMode() ? 'web' : 'tauri';
}

/**
 * 初始化 Web 适配层
 */
export async function initWebAdapter(): Promise<void> {
  if (!isWebMode()) {
    console.log('Running in Tauri mode');
    return;
  }

  console.log('Running in Web mode, initializing web adapters...');
  
  // 请求通知权限
  try {
    await webNotification.requestPermission();
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
  }

  // 检查 Web Serial API 支持
  if (!('serial' in navigator)) {
    console.warn('Web Serial API not supported. Some features will be limited.');
  }

  console.log('Web adapter initialized');
}
