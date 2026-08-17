/**
 * Web 端对话框 API - 替代 Tauri plugin-dialog
 */

/**
 * 打开文件选择对话框
 */
export async function open(options?: {
  multiple?: boolean;
  directory?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (options?.multiple) {
      input.multiple = true;
    }
    
    if (options?.directory) {
      // Web 端不支持目录选择，降级为文件选择
      console.warn('Directory selection not supported on web');
    }
    
    if (options?.filters && options.filters.length > 0) {
      const extensions = options.filters.flatMap(f => f.extensions.map(e => `.${e}`));
      if (extensions.length > 0) {
        input.accept = extensions.join(',');
      }
    }
    
    input.onchange = () => {
      const files = input.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }
      
      if (options?.multiple) {
        const paths: string[] = [];
        for (let i = 0; i < files.length; i++) {
          paths.push(files[i].name);
        }
        resolve(paths);
      } else {
        resolve(files[0].name);
      }
    };
    
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * 打开保存对话框
 */
export async function save(options?: {
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | null> {
  // Web 端无法真正指定保存路径，只能通过 download 属性提示文件名
  console.warn('Save dialog limited on web, using download attribute');
  return options?.defaultPath || 'download.txt';
}

/**
 * 显示消息对话框
 */
export async function message(message: string, options?: {
  title?: string;
  type?: 'info' | 'warning' | 'error';
}): Promise<void> {
  alert(`${options?.title || 'Message'}\n\n${message}`);
}

/**
 * 显示确认对话框
 */
export async function ask(message: string, options?: {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
}): Promise<boolean> {
  return confirm(`${options?.title || 'Confirm'}\n\n${message}`);
}

/**
 * 显示确认对话框（带取消选项）
 */
export async function confirm(message: string, options?: {
  title?: string;
}): Promise<boolean> {
  return ask(message, options);
}
