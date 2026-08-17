/**
 * Web 端 Opener API - 替代 Tauri plugin-opener
 */

/**
 * 在浏览器新标签页中打开 URL
 */
export async function openUrl(url: string): Promise<void> {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 打开文件（Web 端只能下载）
 */
export async function openPath(path: string): Promise<void> {
  console.warn('openPath not fully supported on web, attempting to download:', path);
  // 尝试作为下载处理
  const a = document.createElement('a');
  a.href = path;
  a.download = '';
  a.target = '_blank';
  a.click();
}
