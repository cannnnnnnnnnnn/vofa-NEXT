/**
 * Web 端应用信息 API - 替代 Tauri app API
 */

const APP_NAME = 'VOFA-NEXT';
const APP_VERSION = '0.1.2';

/**
 * 获取应用名称
 */
export async function getName(): Promise<string> {
  return APP_NAME;
}

/**
 * 获取应用版本
 */
export async function getVersion(): Promise<string> {
  return APP_VERSION;
}

/**
 * 获取应用描述
 */
export async function getTauriVersion(): Promise<string> {
  return 'web';
}
