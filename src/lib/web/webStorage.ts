/**
 * Web 存储适配层 - 替代 Tauri plugin-store
 * 使用 localStorage 和 IndexedDB 进行数据持久化
 */

import type { AppSettings } from '../../settings/defaults';

const SETTINGS_KEY = 'vofa-next-settings';
const LAYOUT_KEY = 'vofa-next-layout';
const WIDGETS_KEY = 'vofa-next-widgets';

/**
 * 使用 localStorage 的简单键值存储
 */
export class WebStorage {
  private storage: Storage;

  constructor() {
    this.storage = localStorage;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.getItem(key);
      if (!item) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to delete ${key} from storage:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  has(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}

/**
 * 应用设置存储
 */
export class SettingsStore {
  private storage = new WebStorage();

  async load(): Promise<AppSettings | null> {
    return this.storage.get<AppSettings>(SETTINGS_KEY);
  }

  async save(settings: AppSettings): Promise<void> {
    await this.storage.set(SETTINGS_KEY, settings);
  }

  async update(partial: Partial<AppSettings>): Promise<void> {
    const current = await this.load();
    const updated = { ...current, ...partial };
    await this.save(updated);
  }
}

/**
 * 布局存储
 */
export class LayoutStore {
  private storage = new WebStorage();

  async load(): Promise<any> {
    return this.storage.get(LAYOUT_KEY);
  }

  async save(layout: any): Promise<void> {
    await this.storage.set(LAYOUT_KEY, layout);
  }
}

/**
 * 控件配置存储
 */
export class WidgetsStore {
  private storage = new WebStorage();

  async load(): Promise<any[]> {
    return this.storage.get(WIDGETS_KEY) || [];
  }

  async save(widgets: any[]): Promise<void> {
    await this.storage.set(WIDGETS_KEY, widgets);
  }
}

// 导出单例
export const webStorage = new WebStorage();
export const settingsStore = new SettingsStore();
export const layoutStore = new LayoutStore();
export const widgetsStore = new WidgetsStore();

/**
 * 文件导入/导出功能
 */
export async function saveFile(filename: string, data: Blob): Promise<void> {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openFile(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) {
      input.accept = accept;
    }
    input.onchange = () => {
      const file = input.files?.[0] || null;
      resolve(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function writeTextFile(filename: string, content: string): Promise<void> {
  const blob = new Blob([content], { type: 'text/plain' });
  await saveFile(filename, blob);
}
