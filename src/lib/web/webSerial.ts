/**
 * Web Serial API 类型定义和封装
 * 用于替代 Tauri 的串口功能
 */

export interface SerialPortInfo {
  portId: string;
  name: string;
  manufacturer?: string;
  serialNumber?: string;
  productId?: string;
  vendorId?: string;
}

export interface SerialOptions {
  baudRate: number;
  dataBits?: 8 | 7 | 6;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
  bufferSize?: number;
}

export class WebSerialTransport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isConnected = false;
  private readLoopRunning = false;

  // 事件回调
  onDataReceived?: (data: Uint8Array) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;

  /**
   * 请求用户选择串口
   */
  async requestPort(): Promise<SerialPort | null> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      return this.port;
    } catch (error) {
      console.error('Failed to request serial port:', error);
      return null;
    }
  }

  /**
   * 打开串口连接
   */
  async open(options: SerialOptions): Promise<void> {
    if (!this.port) {
      throw new Error('No port selected. Call requestPort() first.');
    }

    const serialOptions: SerialOptions = {
      baudRate: options.baudRate,
      dataBits: options.dataBits || 8,
      stopBits: options.stopBits || 1,
      parity: options.parity || 'none',
      flowControl: options.flowControl || 'none',
    };

    try {
      await this.port.open(serialOptions);
      this.isConnected = true;
      this.startReadLoop();
    } catch (error) {
      console.error('Failed to open serial port:', error);
      throw error;
    }
  }

  /**
   * 读取数据循环
   */
  private async startReadLoop(): Promise<void> {
    if (!this.port || this.readLoopRunning) {
      return;
    }

    this.readLoopRunning = true;

    try {
      while (this.isConnected && this.port?.readable) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { done, value } = await this.reader.read();
            if (done) {
              break;
            }
            if (value && this.onDataReceived) {
              this.onDataReceived(value);
            }
          }
        } catch (error) {
          console.error('Read error:', error);
          if (this.onError) {
            this.onError(error as Error);
          }
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (error) {
      console.error('Read loop error:', error);
      if (this.onError) {
        this.onError(error as Error);
      }
    } finally {
      this.readLoopRunning = false;
    }
  }

  /**
   * 发送数据
   */
  async write(data: Uint8Array): Promise<void> {
    if (!this.port || !this.isConnected) {
      throw new Error('Port is not open');
    }

    try {
      const writer = this.port.writable?.getWriter();
      if (!writer) {
        throw new Error('Writable stream not available');
      }
      await writer.write(data);
      writer.releaseLock();
    } catch (error) {
      console.error('Write error:', error);
      throw error;
    }
  }

  /**
   * 发送字符串
   */
  async writeString(text: string): Promise<void> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    await this.write(data);
  }

  /**
   * 关闭串口
   */
  async close(): Promise<void> {
    this.isConnected = false;

    if (this.reader) {
      await this.reader.cancel();
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (error) {
        console.error('Error closing port:', error);
      }
      this.port = null;
    }

    if (this.onDisconnect) {
      this.onDisconnect();
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): boolean {
    return this.isConnected;
  }
}

/**
 * 获取可用的串口列表
 */
export async function getAvailablePorts(): Promise<SerialPortInfo[]> {
  if (!('serial' in navigator)) {
    console.warn('Web Serial API not supported');
    return [];
  }

  // Web Serial API 需要用户主动触发才能请求端口
  // 这里返回空数组，实际使用时需要调用 requestPort
  return [];
}

/**
 * 请求用户选择一个串口
 */
export async function requestSerialPort(): Promise<SerialPort | null> {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported in this browser');
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    return port;
  } catch (error) {
    console.error('Failed to request serial port:', error);
    return null;
  }
}
