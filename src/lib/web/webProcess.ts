/**
 * Web 端进程 API - 替代 Tauri plugin-process
 */

/**
 * 退出应用（Web 端只能关闭标签页或窗口）
 */
export async function exit(code?: number): Promise<void> {
  console.log('Exit requested with code:', code);
  // Web 端无法真正退出，只能关闭窗口或显示提示
  if (confirm('Do you want to close this tab?')) {
    window.close();
  }
}

/**
 * 重启应用（Web 端刷新页面）
 */
export async function relaunch(): Promise<void> {
  console.log('Relaunch requested');
  window.location.reload();
}
