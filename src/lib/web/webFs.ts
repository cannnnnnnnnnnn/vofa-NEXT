/**
 * Web 端文件系统 API - 替代 Tauri plugin-fs
 */

import { saveFile, openFile, readTextFile as readFileContent } from './webStorage';

/**
 * 读取文本文件
 */
export async function readTextFile(path: string): Promise<string> {
  // Web 端无法直接读取任意路径的文件
  // 需要通过文件选择器获取 File 对象
  console.warn('readTextFile requires user interaction on web');
  const file = await openFile('.json,.txt');
  if (!file) {
    throw new Error('No file selected');
  }
  return readFileContent(file);
}

/**
 * 写入文本文件
 */
export async function writeTextFile(path: string, contents: string): Promise<void> {
  // Web 端只能通过 download 方式"保存"文件
  const blob = new Blob([contents], { type: 'text/plain' });
  await saveFile(path, blob);
}

/**
 * 读取二进制文件
 */
export async function readBinaryFile(path: string): Promise<Uint8Array> {
  console.warn('readBinaryFile requires user interaction on web');
  const file = await openFile();
  if (!file) {
    throw new Error('No file selected');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 写入二进制文件
 */
export async function writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  await saveFile(path, blob);
}

/**
 * 检查文件是否存在（Web 端无法检查）
 */
export async function exists(path: string): Promise<boolean> {
  console.warn('exists check not available on web');
  return false;
}

/**
 * 创建目录（Web 端无法创建）
 */
export async function mkdir(path: string): Promise<void> {
  console.warn('mkdir not available on web');
}

/**
 * 删除文件（Web 端无法删除）
 */
export async function remove(path: string): Promise<void> {
  console.warn('remove not available on web');
}

/**
 * 重命名文件（Web 端无法重命名）
 */
export async function rename(oldPath: string, newPath: string): Promise<void> {
  console.warn('rename not available on web');
}

/**
 * 复制文件（Web 端无法复制）
 */
export async function copy(srcPath: string, destPath: string): Promise<void> {
  console.warn('copy not available on web');
}

/**
 * 列出目录内容（Web 端无法列出）
 */
export async function readDir(path: string): Promise<any[]> {
  console.warn('readDir not available on web');
  return [];
}

/**
 * 获取文件大小（Web 端无法获取）
 */
export async function stat(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean }> {
  console.warn('stat not available on web');
  return { size: 0, isFile: false, isDirectory: false };
}

/**
 * 获取应用数据目录（Web 端返回临时目录）
 */
export async function appDataDir(): Promise<string> {
  return 'web-storage';
}

/**
 * 获取文档目录（Web 端返回下载目录）
 */
export async function documentDir(): Promise<string> {
  return 'downloads';
}

/**
 * 获取下载目录
 */
export async function downloadDir(): Promise<string> {
  return 'downloads';
}
