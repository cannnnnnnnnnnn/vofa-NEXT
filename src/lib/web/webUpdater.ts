/**
 * Web 端更新器 API - 替代 Tauri plugin-updater
 */

import { emit } from './webEvents';

interface UpdateManifest {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms?: Record<string, { signature: string; url: string }>;
}

interface Update {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  manifest?: UpdateManifest;
}

const CURRENT_VERSION = '0.1.2';

/**
 * 检查更新
 */
export async function check(): Promise<Update | null> {
  console.log('Checking for updates (web mode)...');
  
  // Web 端无法自动更新，只能提示用户刷新页面或重新部署
  try {
    // 可以在此处检查远程版本文件
    // const response = await fetch('/version.json');
    // const remoteVersion = await response.json();
    
    // 模拟无更新
    return {
      available: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

/**
 * 下载并安装更新（Web 端不支持）
 */
export async function downloadAndInstall(): Promise<void> {
  console.warn('Auto-update not supported on web. Please refresh the page.');
  // 提示用户刷新页面
  if (confirm('A new version is available. Refresh the page?')) {
    window.location.reload();
  }
}

/**
 * 触发更新检查事件
 */
export async function checkUpdate(): Promise<void> {
  const update = await check();
  await emit('tauri://update-available', update);
}

/**
 * 监听更新状态
 */
export function onUpdateAvailable(callback: (update: Update) => void): () => void {
  // 这是一个简化实现
  return () => {};
}
