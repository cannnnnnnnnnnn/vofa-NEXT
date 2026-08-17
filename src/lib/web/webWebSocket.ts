/**
 * WebSocket 传输层 - 用于 Web 端的 TCP/UDP 连接
 * 
 * 由于浏览器限制，Web 端无法直接使用 TCP/UDP Socket
 * 需要通过 WebSocket 连接到后端代理服务
 */

export interface WebSocketTransportConfig {
  url: string;
  protocols?: string[];
}

export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private config: WebSocketTransportConfig | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  public onConnected?: () => void;
  public onDisconnected?: (reason: string) => void;
  public onDataReceived?: (data: Uint8Array) => void;
  public onError?: (error: Error) => void;

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(config: WebSocketTransportConfig): Promise<void> {
    this.config = config;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(config.url, config.protocols || []);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnected?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          
          // 尝试重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${delay}ms...`);
            setTimeout(() => this.connect(config), delay);
          } else {
            this.onDisconnected?.(`Connection closed: ${event.reason || 'Unknown reason'}`);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onError?.(new Error('WebSocket connection failed'));
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            const data = new Uint8Array(event.data);
            this.onDataReceived?.(data);
          } else if (event.data instanceof Blob) {
            // 处理 Blob 数据
            event.data.arrayBuffer().then(buffer => {
              const data = new Uint8Array(buffer);
              this.onDataReceived?.(data);
            });
          } else {
            // 处理文本数据
            const encoder = new TextEncoder();
            const data = encoder.encode(event.data as string);
            this.onDataReceived?.(data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 发送二进制数据
   */
  async send(data: Uint8Array): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(data);
  }

  /**
   * 发送字符串
   */
  async sendString(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(text);
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * 获取连接状态
   */
  getState(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      connected: this.isConnected,
      url: this.config?.url || '',
      readyState: this.ws?.readyState || WebSocket.CLOSED,
    };
  }
}

/**
 * 创建 WebSocket 传输实例
 */
export function createWebSocketTransport(): WebSocketTransport {
  return new WebSocketTransport();
}
